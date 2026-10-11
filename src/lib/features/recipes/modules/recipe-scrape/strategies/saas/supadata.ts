/**
 * Supadata — social media provider (YouTube, TikTok, Instagram, X, Facebook).
 * Endpoints: GET https://api.supadata.ai/v1/metadata · /transcript  ·  Auth: `x-api-key` header.
 *
 * Cost-efficient cascade (cheapest first, stops as soon as the content looks
 * like a recipe):
 *   A. metadata — caption/title (~1 credit)
 *   B. native transcript — existing captions only (~1 credit)
 *   C. generated transcript — AI transcription (~2 credits/min, last resort)
 *
 * Emits `markdown` like every other SaaS strategy, so LLM enrichment
 * downstream needs no changes. Image comes from the metadata thumbnail.
 */
import { scraperConfig } from '../../config';
import { passesQualityGate } from '../../quality';
import { failed, notFound, ok, type ScrapeStrategy } from '../base';
import { isSocialUrl } from './social-urls';

const API_BASE = 'https://api.supadata.ai/v1';
/** Whole-strategy budget (metadata + transcripts + async polling). */
const TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 2_000;
/** Cap on the transcript portion so LLM input stays bounded; captions are kept whole. */
const MAX_TRANSCRIPT_CHARS = 24_000;

interface SupadataMetadata {
    title?: string | null;
    description?: string | null;
    author?: { username?: string | null; displayName?: string | null } | null;
    tags?: string[] | null;
    media?: {
        thumbnailUrl?: string | null;
        url?: string | null;
        items?: Array<{ thumbnailUrl?: string | null; url?: string | null }> | null;
    } | null;
}

interface TranscriptChunk {
    text?: string | null;
}

function transcriptToText(content: unknown): string {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
        return content
            .map((chunk) => (chunk as TranscriptChunk)?.text ?? '')
            .filter((text) => text.trim().length > 0)
            .join('\n');
    }
    return '';
}

function extractImage(metadata: SupadataMetadata): string | undefined {
    const media = metadata.media;
    if (!media) return undefined;
    if (typeof media.thumbnailUrl === 'string' && media.thumbnailUrl) return media.thumbnailUrl;
    if (typeof media.url === 'string' && media.url) return media.url;
    for (const item of media.items ?? []) {
        if (item?.thumbnailUrl) return item.thumbnailUrl;
        if (item?.url) return item.url;
    }
    return undefined;
}

function buildMarkdown(url: string, metadata: SupadataMetadata, transcript: string | null): string {
    const sections: string[] = [];
    const title = metadata.title?.trim();
    sections.push(`# ${title || 'Social media post'}`);
    sections.push(`Source: ${url}`);
    const author = metadata.author?.displayName || metadata.author?.username;
    if (author?.trim()) sections.push(`Author: ${author.trim()}`);
    const description = metadata.description?.trim();
    if (description) sections.push(`## Caption\n${description}`);
    const tags = (metadata.tags ?? []).filter((tag) => tag.trim().length > 0);
    if (tags.length > 0) sections.push(`Tags: ${tags.join(', ')}`);
    const text = transcript?.trim();
    if (text) {
        const capped =
            text.length > MAX_TRANSCRIPT_CHARS
                ? `${text.slice(0, MAX_TRANSCRIPT_CHARS)}\n\n[transcript truncated]`
                : text;
        sections.push(`## Transcript\n${capped}`);
    }
    return sections.join('\n\n').trim();
}

class SupadataHttpError extends Error {
    constructor(
        readonly status: number,
        message: string
    ) {
        super(message);
    }
}

async function fetchJson(url: string, apiKey: string, signal: AbortSignal): Promise<unknown> {
    const response = await fetch(url, {
        headers: { 'x-api-key': apiKey },
        signal
    });
    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new SupadataHttpError(
            response.status,
            `Supadata returned HTTP ${response.status}: ${detail.slice(0, 200)}`
        );
    }
    return (await response.json()) as unknown;
}

/** Polls an async transcript job until completed/failed. Resolves null when the abort fires. */
async function pollTranscriptJob(
    apiKey: string,
    jobId: string,
    signal: AbortSignal
): Promise<string | null> {
    while (!signal.aborted) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        if (signal.aborted) return null;
        const json = (await fetchJson(`${API_BASE}/transcript/${jobId}`, apiKey, signal)) as {
            status?: string;
            content?: unknown;
            error?: unknown;
        };
        if (json.status === 'completed') return transcriptToText(json.content);
        if (json.status === 'failed') {
            throw new Error(`Supadata transcript job failed: ${JSON.stringify(json.error)?.slice(0, 200)}`);
        }
        // 'queued' | 'active' → keep polling within the overall budget.
    }
    return null;
}

/**
 * Fetches a plain-text transcript. Returns null when none is available
 * (HTTP 206) or the overall timeout fires — never throws for those cases.
 */
async function fetchTranscript(
    url: string,
    apiKey: string,
    mode: 'native' | 'auto',
    signal: AbortSignal
): Promise<string | null> {
    const response = await fetch(
        `${API_BASE}/transcript?url=${encodeURIComponent(url)}&text=true&mode=${mode}`,
        { headers: { 'x-api-key': apiKey }, signal }
    );
    // 206 Transcript Unavailable — still billed, but there is nothing to use.
    if (response.status === 206) return null;
    if (response.status === 202) {
        const json = (await response.json()) as { jobId?: string };
        if (!json.jobId) return null;
        return await pollTranscriptJob(apiKey, json.jobId, signal);
    }
    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new SupadataHttpError(
            response.status,
            `Supadata transcript (${mode}) returned HTTP ${response.status}: ${detail.slice(0, 200)}`
        );
    }
    const json = (await response.json()) as { jobId?: string; content?: unknown };
    if (typeof json.jobId === 'string' && json.jobId) {
        return await pollTranscriptJob(apiKey, json.jobId, signal);
    }
    return transcriptToText(json.content);
}

function isAbort(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'AbortError';
}

function toStrategyError(error: unknown) {
    if (isAbort(error)) return failed('timeout', 'Supadata timed out (30s budget exceeded)');
    if (error instanceof SupadataHttpError) {
        // Private/removed/restricted videos: let the next strategy try, if any can.
        if (error.status === 404 || error.status === 403) return notFound(error.message);
        if (error.status === 401 || error.status === 402)
            return failed('misconfigured', `Supadata key rejected: ${error.message}`);
        if (error.status === 429) return failed('rate_limited', error.message);
        return failed('error', error.message);
    }
    return failed('error', error instanceof Error ? error.message : String(error));
}

export const supadataStrategy: ScrapeStrategy = {
    name: 'supadata',
    costRank: 4,
    urlPriority: (url) => isSocialUrl(url),
    enabled: () => Boolean(scraperConfig.supadata.apiKey),
    async scrape(url) {
        const apiKey = scraperConfig.supadata.apiKey ?? '';
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        const { signal } = controller;

        try {
            const metadata = (await fetchJson(
                `${API_BASE}/metadata?url=${encodeURIComponent(url)}`,
                apiKey,
                signal
            )) as SupadataMetadata;
            const image = extractImage(metadata);
            const source = { url, domain: (() => { try { return new URL(url).hostname; } catch { return undefined; } })() };

            // Phase A: caption first (cheapest) — stop here when it already reads as a recipe.
            let content = buildMarkdown(url, metadata, null);
            if (passesQualityGate('markdown', content)) {
                return ok('markdown', content, { image, source });
            }

            // Phase B: native (pre-existing) transcript — cheap, no AI generation.
            let transcript: string | null = null;
            try {
                transcript = await fetchTranscript(url, apiKey, 'native', signal);
            } catch (error) {
                if (isAbort(error)) throw error;
                // A failed native lookup must not block the generate fallback.
                transcript = null;
            }
            if (transcript?.trim()) {
                content = buildMarkdown(url, metadata, transcript);
                if (passesQualityGate('markdown', content)) {
                    return ok('markdown', content, { image, source });
                }
                // Native captions are the same words generation would transcribe —
                // generating on top would resilience-spend for nothing.
                return notFound('Social post has no recipe content in its caption or transcript');
            }

            // Phase C: AI-generated transcript (expensive, last resort).
            transcript = await fetchTranscript(url, apiKey, 'auto', signal);
            if (!transcript?.trim()) {
                return notFound('Social post has no recipe content in its caption or transcript');
            }
            content = buildMarkdown(url, metadata, transcript);
            if (!passesQualityGate('markdown', content)) {
                return notFound('Social post transcript does not look like a recipe');
            }
            return ok('markdown', content, { image, source });
        } catch (error) {
            return toStrategyError(error);
        } finally {
            clearTimeout(timer);
        }
    }
};
