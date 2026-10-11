/**
 * Supadata — social media provider (YouTube, TikTok, Instagram, X, Facebook).
 * Endpoints: GET https://api.supadata.ai/v1/metadata · /transcript  ·  Auth: `x-api-key` header.
 *
 * Cost-efficient cascade (cheapest first, stops as soon as the content looks
 * like a recipe):
 *   A. metadata — caption/title (~1 credit). Early exit only when the caption
 *      passes the *strict* ingredient gate: the loose gate matches promo
 *      captions that merely mention "recipes" ("get all my recipes in my
 *      cookbook") while containing no actual recipe.
 *   B. native transcript — existing captions only (~1 credit)
 *   C. generated transcript — AI transcription (~2 credits/min, last resort)
 *
 * Transcript content is judged by the strict gate too: the promo caption
 * stays in the combined content and would satisfy the loose keyword gate
 * on its own, so only quantity signals count as recipe evidence.
 *
 * Emits `markdown` like every other SaaS strategy, so LLM enrichment
 * downstream needs no changes. Image comes from the metadata thumbnail.
 * Every Supadata call is traced (endpoint, mode, billed credits, latency)
 * into `providerStats`, persisted in `recipes_cache.scrape_stats`.
 */
import { scraperConfig } from '../../config';
import { markdownHasIngredientSignals } from '../../quality';
import type { ScrapeProviderStats, SupadataCallStat } from '../../types';
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

/** Content carrying a recipe: actual ingredient quantities, not just the word "recipes". */
function contentLooksLikeRecipe(content: string): boolean {
    return markdownHasIngredientSignals(content);
}

class SupadataHttpError extends Error {
    constructor(
        readonly status: number,
        message: string
    ) {
        super(message);
    }
}

function readCredits(response: Response): number | null {
    const raw = response.headers.get('x-billable-requests');
    const credits = raw === null ? NaN : Number(raw);
    return Number.isFinite(credits) ? credits : null;
}

/**
 * One traced Supadata GET: records endpoint, mode, status, billed credits
 * and latency into `calls` (even on HTTP errors), then returns the response
 * for the caller to interpret (200/202/206/...).
 */
async function supadataGet(
    calls: SupadataCallStat[],
    url: string,
    apiKey: string,
    signal: AbortSignal,
    meta: { endpoint: SupadataCallStat['endpoint']; mode?: string }
): Promise<Response> {
    const startedAt = performance.now();
    try {
        const response = await fetch(url, {
            headers: { 'x-api-key': apiKey },
            signal
        });
        calls.push({
            ...meta,
            httpStatus: response.status,
            credits: readCredits(response),
            latencyMs: Math.round(performance.now() - startedAt),
            chars: 0
        });
        return response;
    } catch (error) {
        if (!isAbort(error)) {
            calls.push({
                ...meta,
                httpStatus: null,
                credits: null,
                latencyMs: Math.round(performance.now() - startedAt),
                chars: 0
            });
        }
        throw error;
    }
}

async function readJson(response: Response): Promise<unknown> {
    return (await response.json()) as unknown;
}

function httpError(status: number, detail: string, context: string): SupadataHttpError {
    return new SupadataHttpError(status, `Supadata ${context} returned HTTP ${status}: ${detail.slice(0, 200)}`);
}

/** Polls an async transcript job until completed/failed. Resolves null when the abort fires. */
async function pollTranscriptJob(
    calls: SupadataCallStat[],
    callIndex: number,
    apiKey: string,
    jobId: string,
    signal: AbortSignal
): Promise<string | null> {
    let polls = 0;
    while (!signal.aborted) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        if (signal.aborted) return null;
        const response = await supadataGet(
            calls,
            `${API_BASE}/transcript/${jobId}`,
            apiKey,
            signal,
            { endpoint: 'transcript', mode: 'job-poll' }
        );
        // Polls are free — fold them into the parent call instead of spamming the trail.
        calls.pop();
        polls += 1;
        const json = (await readJson(response)) as {
            status?: string;
            content?: unknown;
            error?: unknown;
        };
        if (json.status === 'completed') {
            const text = transcriptToText(json.content);
            calls[callIndex].polls = polls;
            calls[callIndex].chars = text.length;
            return text;
        }
        if (json.status === 'failed') {
            calls[callIndex].polls = polls;
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
    calls: SupadataCallStat[],
    url: string,
    apiKey: string,
    mode: 'native' | 'auto',
    signal: AbortSignal
): Promise<string | null> {
    const response = await supadataGet(
        calls,
        `${API_BASE}/transcript?url=${encodeURIComponent(url)}&text=true&mode=${mode}`,
        apiKey,
        signal,
        { endpoint: 'transcript', mode }
    );
    const callIndex = calls.length - 1;
    // 206 Transcript Unavailable — still billed, but there is nothing to use.
    if (response.status === 206) return null;
    if (response.status === 202) {
        const json = (await readJson(response)) as { jobId?: string };
        if (!json.jobId) return null;
        return await pollTranscriptJob(calls, callIndex, apiKey, json.jobId, signal);
    }
    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw httpError(response.status, detail, `transcript (${mode})`);
    }
    const json = (await readJson(response)) as { jobId?: string; content?: unknown };
    if (typeof json.jobId === 'string' && json.jobId) {
        return await pollTranscriptJob(calls, callIndex, apiKey, json.jobId, signal);
    }
    const text = transcriptToText(json.content);
    calls[callIndex].chars = text.length;
    return text;
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

function buildProviderStats(
    calls: SupadataCallStat[],
    input: {
        captionChars: number;
        transcriptChars: number;
        transcriptMode: ScrapeProviderStats['transcriptMode'];
        captionPassedGate: boolean;
    }
): ScrapeProviderStats {
    const billed = calls.map((call) => call.credits).filter((credits) => credits !== null);
    return {
        provider: 'supadata',
        calls,
        captionChars: input.captionChars,
        transcriptChars: input.transcriptChars,
        transcriptMode: input.transcriptMode,
        captionPassedGate: input.captionPassedGate,
        totalCredits: billed.length > 0 ? billed.reduce((sum, credits) => sum + credits, 0) : null
    };
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
        const calls: SupadataCallStat[] = [];

        try {
            const metaResponse = await supadataGet(
                calls,
                `${API_BASE}/metadata?url=${encodeURIComponent(url)}`,
                apiKey,
                signal,
                { endpoint: 'metadata' }
            );
            if (!metaResponse.ok) {
                const detail = await metaResponse.text().catch(() => '');
                throw httpError(metaResponse.status, detail, 'metadata');
            }
            const metadata = (await readJson(metaResponse)) as SupadataMetadata;
            const image = extractImage(metadata);
            const source = { url, domain: (() => { try { return new URL(url).hostname; } catch { return undefined; } })() };
            const captionChars = (metadata.description ?? '').trim().length;
            calls[calls.length - 1].chars = captionChars;

            // Phase A: caption first (cheapest) — but only when it carries
            // actual ingredient quantities, not just the word "recipes".
            const caption = buildMarkdown(url, metadata, null);
            const captionPassedGate = markdownHasIngredientSignals(caption);
            if (captionPassedGate) {
                return {
                    ...ok('markdown', caption, { image, source }),
                    providerStats: buildProviderStats(calls, {
                        captionChars,
                        transcriptChars: 0,
                        transcriptMode: 'none',
                        captionPassedGate
                    })
                };
            }

            // Phase B: native (pre-existing) transcript — cheap, no AI generation.
            let transcript: string | null = null;
            try {
                transcript = await fetchTranscript(calls, url, apiKey, 'native', signal);
            } catch (error) {
                if (isAbort(error)) throw error;
                // A failed native lookup must not block the generate fallback.
                transcript = null;
            }
            if (transcript?.trim()) {
                const content = buildMarkdown(url, metadata, transcript);
                if (contentLooksLikeRecipe(content)) {
                    return {
                        ...ok('markdown', content, { image, source }),
                        providerStats: buildProviderStats(calls, {
                            captionChars,
                            transcriptChars: transcript.trim().length,
                            transcriptMode: 'native',
                            captionPassedGate
                        })
                    };
                }
                // Native captions are the same words generation would transcribe —
                // generating on top would spend credits for nothing.
                return notFound('Social post has no recipe content in its caption or transcript');
            }

            // Phase C: AI-generated transcript (expensive, last resort).
            transcript = await fetchTranscript(calls, url, apiKey, 'auto', signal);
            if (!transcript?.trim()) {
                return notFound('Social post has no recipe content in its caption or transcript');
            }
            const content = buildMarkdown(url, metadata, transcript);
            if (!contentLooksLikeRecipe(content)) {
                return notFound('Social post transcript does not look like a recipe');
            }
            return {
                ...ok('markdown', content, { image, source }),
                providerStats: buildProviderStats(calls, {
                    captionChars,
                    transcriptChars: transcript.trim().length,
                    transcriptMode: 'generated',
                    captionPassedGate
                })
            };
        } catch (error) {
            return toStrategyError(error);
        } finally {
            clearTimeout(timer);
        }
    }
};
