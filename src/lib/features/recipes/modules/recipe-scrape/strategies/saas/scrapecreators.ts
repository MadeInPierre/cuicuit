/**
 * ScrapeCreators — social media provider (YouTube, TikTok, Instagram, X, Facebook).
 * Base URL: https://api.scrapecreators.com  ·  Auth: `x-api-key` header.
 *
 * Per-platform info + transcript endpoints, each ~1 credit live and 0 credits
 * when served from the provider cache (`cache_max_age=30d`). Runs before
 * Supadata for social URLs; Supadata remains the fallback (and the only
 * AI-generation source — ScrapeCreators' AI fallback is never enabled here,
 * keeping every call at ~1 credit).
 *
 * Cascade (cheapest first, same gates as Supadata):
 *   A. info endpoint (TikTok requests its transcript inline) — early exit
 *      only when the caption passes the strict ingredient gate.
 *   B. transcript endpoint — native captions only.
 *
 * Emits the shared social `markdown` shape and the same `providerStats`
 * envelope as Supadata, so `scrape_stats` analytics work across providers.
 */
import { scraperConfig } from '../../config';
import { markdownHasIngredientSignals } from '../../quality';
import type { ProviderCallStat, ScrapeProviderStats } from '../../types';
import { failed, notFound, ok, type ScrapeStrategy } from '../base';
import { buildSocialMarkdown } from './social-markdown';
import { isSocialUrl, socialPlatform, type SocialPlatform } from './social-urls';

const API_BASE = 'https://api.scrapecreators.com';
/**
 * E2E timeout (info + transcript). Generous on purpose as Instagram can really take
 * >30s, and the provider completes + charges the request anyway so better get it.
 */
const TIMEOUT_MS = 60_000;
/** Provider-side cache window: repeat hits (any customer) cost 0 credits. */
const CACHE_MAX_AGE = '30d';

interface PlatformEndpoints {
    info: string;
    /** Extra info params (e.g. TikTok's inline transcript). */
    infoParams?: Record<string, string>;
    transcript: string;
}

const PLATFORM_ENDPOINTS: Record<SocialPlatform, PlatformEndpoints> = {
    youtube: { info: '/v1/youtube/video', transcript: '/v1/youtube/video/transcript' },
    tiktok: {
        info: '/v2/tiktok/video',
        infoParams: { get_transcript: 'true' },
        transcript: '/v1/tiktok/video/transcript'
    },
    instagram: { info: '/v1/instagram/post', transcript: '/v2/instagram/media/transcript' },
    twitter: { info: '/v1/twitter/tweet', transcript: '/v1/twitter/tweet/transcript' },
    facebook: { info: '/v1/facebook/post', transcript: '/v1/facebook/post/transcript' }
};

interface NormalizedInfo {
    title?: string;
    author?: string;
    caption?: string;
    tags?: string[];
    image?: string;
    transcript?: string;
}

function str(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value : undefined;
}

function firstString(list: unknown): string | undefined {
    if (!Array.isArray(list)) return undefined;
    for (const item of list) {
        const text = str(item);
        if (text) return text;
    }
    return undefined;
}

/** TikTok transcripts arrive as WEBVTT — keep only the spoken lines. */
function cleanWebVtt(text: string): string {
    return text
        .split('\n')
        .map((line) => line.trim())
        .filter(
            (line) =>
                line.length > 0 &&
                line !== 'WEBVTT' &&
                !line.includes('-->') &&
                !/^\d{2}:\d{2}(:\d{2})?/.test(line)
        )
        .join(' ');
}

function joinChunkTexts(chunks: unknown): string | undefined {
    if (!Array.isArray(chunks)) return undefined;
    const text = chunks
        .map((chunk) => str((chunk as { text?: unknown })?.text) ?? '')
        .filter((line) => line.trim().length > 0)
        .join('\n');
    return text.trim() ? text : undefined;
}

/** Normalizes the five info-endpoint shapes into one social post. */
function normalizeInfo(platform: SocialPlatform, json: Record<string, unknown>): NormalizedInfo {
    switch (platform) {
        case 'youtube': {
            const channel = (json.channel ?? {}) as Record<string, unknown>;
            const keywords = Array.isArray(json.keywords)
                ? json.keywords.filter((k): k is string => typeof k === 'string')
                : [];
            return {
                title: str(json.title),
                author: str(channel.title) ?? str(channel.handle),
                caption: str(json.description),
                tags: keywords,
                image: str(json.thumbnail),
                transcript:
                    str(json.transcript_only_text) ?? joinChunkTexts(json.transcript)
            };
        }
        case 'tiktok': {
            const detail = (json.aweme_detail ?? {}) as Record<string, unknown>;
            const author = (detail.author ?? {}) as Record<string, unknown>;
            const video = (detail.video ?? {}) as Record<string, unknown>;
            const cover = (video.cover ?? video.origin_cover ?? {}) as Record<string, unknown>;
            const coverList = Array.isArray(cover.url_list) ? cover.url_list : [];
            const rawTranscript = str(json.transcript);
            return {
                caption: str(detail.desc),
                author: str(author.nickname) ?? str(author.unique_id),
                image: firstString(coverList),
                transcript: rawTranscript ? cleanWebVtt(rawTranscript) : undefined
            };
        }
        case 'instagram': {
            const media = ((json.data ?? {}) as Record<string, unknown>).xdt_shortcode_media as
                | Record<string, unknown>
                | undefined;
            const edges = (media?.edge_media_to_caption ?? {}) as Record<string, unknown>;
            const captionEdges = (Array.isArray(edges.edges) ? edges.edges : []) as Array<
                Record<string, unknown>
            >;
            const captionNode = (captionEdges[0]?.node ?? {}) as Record<string, unknown>;
            const owner = (media?.owner ?? {}) as Record<string, unknown>;
            return {
                caption: str(captionNode.text),
                author: str(owner.username),
                // thumbnail_src is Instagram's selected cover frame (looks nicer
                // than display_url on video posts) keep display_url as fallback
                image: str(media?.thumbnail_src) ?? str(media?.display_url)
            };
        }
        case 'twitter': {
            const legacy = (json.legacy ?? {}) as Record<string, unknown>;
            const entities = (legacy.entities ?? {}) as Record<string, unknown>;
            const media = (Array.isArray(entities.media) ? entities.media : []) as Array<
                Record<string, unknown>
            >;
            return {
                caption: str(legacy.full_text),
                image: firstString(media.map((item) => item.media_url_https))
            };
        }
        case 'facebook': {
            const author = (json.author ?? {}) as Record<string, unknown>;
            const video = (json.video ?? {}) as Record<string, unknown>;
            return {
                caption: str(json.description),
                author: str(author.name),
                image: str(json.image_url) ?? str(video.thumbnail)
            };
        }
    }
}

/** Normalizes the five transcript-endpoint shapes into plain text. */
function normalizeTranscript(platform: SocialPlatform, json: Record<string, unknown>): string | undefined {
    switch (platform) {
        case 'youtube':
            return str(json.transcript_only_text) ?? joinChunkTexts(json.transcript);
        case 'tiktok': {
            const raw = str(json.transcript);
            return raw ? cleanWebVtt(raw) : undefined;
        }
        case 'instagram': {
            const transcripts = Array.isArray(json.transcripts) ? json.transcripts : [];
            const text = transcripts
                .map((item) => str((item as Record<string, unknown>).text) ?? '')
                .filter((line) => line.trim().length > 0)
                .join('\n');
            return text.trim() ? text : undefined;
        }
        case 'twitter':
        case 'facebook':
            return str(json.transcript);
    }
}

class ScrapeCreatorsHttpError extends Error {
    constructor(
        readonly status: number,
        message: string
    ) {
        super(message);
    }
}

function isAbort(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'AbortError';
}

/**
 * One traced ScrapeCreators GET. Credits come from the `credits_charged`
 * response body (cached hits report 0 with `cached: true`).
 */
async function scrapeCreatorsGet(
    calls: ProviderCallStat[],
    path: string,
    params: Record<string, string>,
    apiKey: string,
    signal: AbortSignal,
    meta: { endpoint: string; mode?: string }
): Promise<{ json: Record<string, unknown>; callIndex: number }> {
    const query = new URLSearchParams({ ...params, cache_max_age: CACHE_MAX_AGE }).toString();
    const startedAt = performance.now();
    let response: Response;
    try {
        response = await fetch(`${API_BASE}${path}?${query}`, {
            headers: { 'x-api-key': apiKey },
            signal
        });
    } catch (error) {
        // Network-level failure (not an abort): record the call to log a credit spent
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
    const latencyMs = Math.round(performance.now() - startedAt);
    if (!response.ok) {
        calls.push({ ...meta, httpStatus: response.status, credits: null, latencyMs, chars: 0 });
        const detail = await response.text().catch(() => '');
        throw new ScrapeCreatorsHttpError(
            response.status,
            `ScrapeCreators ${meta.endpoint} returned HTTP ${response.status}: ${detail.slice(0, 200)}`
        );
    }
    const json = (await response.json()) as Record<string, unknown>;
    const credits = typeof json.credits_charged === 'number' ? json.credits_charged : null;
    calls.push({
        ...meta,
        httpStatus: response.status,
        credits,
        latencyMs,
        chars: 0,
        cached: json.cached === true ? true : undefined
    });
    return { json, callIndex: calls.length - 1 };
}

function toStrategyError(error: unknown) {
    if (isAbort(error)) {
        return failed('timeout', `ScrapeCreators timed out (${TIMEOUT_MS / 1000}s budget exceeded)`);
    }
    if (error instanceof ScrapeCreatorsHttpError) {
        // Rejected/restricted/removed posts: let the next provider try.
        if (error.status === 400 || error.status === 403 || error.status === 404) {
            return notFound(error.message);
        }
        if (error.status === 401) {
            return failed('misconfigured', `ScrapeCreators key rejected: ${error.message}`);
        }
        if (error.status === 402) return failed('quota', `ScrapeCreators credits exhausted: ${error.message}`);
        return failed('error', error.message);
    }
    return failed('error', error instanceof Error ? error.message : String(error));
}

/** Content carrying a recipe: actual ingredient quantities, not just the word "recipes". */
function contentLooksLikeRecipe(content: string): boolean {
    return markdownHasIngredientSignals(content);
}

function buildProviderStats(
    calls: ProviderCallStat[],
    input: {
        captionChars: number;
        transcriptChars: number;
        transcriptMode: ScrapeProviderStats['transcriptMode'];
        captionPassedGate: boolean;
    }
): ScrapeProviderStats {
    const billed = calls.map((call) => call.credits).filter((credits) => credits !== null);
    return {
        provider: 'scrapecreators',
        calls,
        captionChars: input.captionChars,
        transcriptChars: input.transcriptChars,
        transcriptMode: input.transcriptMode,
        captionPassedGate: input.captionPassedGate,
        totalCredits: billed.length > 0 ? billed.reduce((sum, credits) => sum + credits, 0) : null
    };
}

export const scrapeCreatorsStrategy: ScrapeStrategy = {
    name: 'scrapecreators',
    costRank: 4,
    urlPriority: (url) => isSocialUrl(url),
    supportsUrl: (url) => isSocialUrl(url),
    enabled: () => Boolean(scraperConfig.scrapecreators.apiKey),
    async scrape(url) {
        const platform = socialPlatform(url);
        if (!platform) return notFound(`ScrapeCreators does not support this URL: ${url}`);
        const endpoints = PLATFORM_ENDPOINTS[platform];
        const apiKey = scraperConfig.scrapecreators.apiKey ?? '';
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        const { signal } = controller;
        const calls: ProviderCallStat[] = [];

        try {
            const source = { url, domain: (() => { try { return new URL(url).hostname; } catch { return undefined; } })() };

            // Phase A: info (+ inline transcript on TikTok) — early exit only
            // when the caption carries actual ingredient quantities.
            const info = await scrapeCreatorsGet(
                calls,
                endpoints.info,
                { url, ...(endpoints.infoParams ?? {}) },
                apiKey,
                signal,
                { endpoint: 'info', mode: platform }
            );
            const post = normalizeInfo(platform, info.json);
            const captionChars = (post.caption ?? '').trim().length;
            calls[info.callIndex].chars = captionChars;
            const caption = buildSocialMarkdown({ ...post, url, transcript: null });
            const captionPassedGate = markdownHasIngredientSignals(caption);
            if (captionPassedGate) {
                return {
                    ...ok('markdown', caption, { image: post.image, source }),
                    providerStats: buildProviderStats(calls, {
                        captionChars,
                        transcriptChars: 0,
                        transcriptMode: post.transcript?.trim() ? 'native' : 'none',
                        captionPassedGate
                    })
                };
            }

            // Phase B: transcript endpoint (native captions only — no AI fallback,
            // Supadata covers generation). TikTok usually already has its
            // transcript inline from Phase A and skips this call.
            let transcript = post.transcript ?? null;
            if (!transcript?.trim()) {
                transcript = null;
                try {
                    const result = await scrapeCreatorsGet(
                        calls,
                        endpoints.transcript,
                        { url },
                        apiKey,
                        signal,
                        { endpoint: 'transcript', mode: platform }
                    );
                    transcript = normalizeTranscript(platform, result.json) ?? null;
                    if (transcript?.trim()) calls[result.callIndex].chars = transcript.trim().length;
                } catch (error) {
                    if (isAbort(error)) throw error;
                    // A failed transcript lookup ends the cascade, not the import —
                    // the next provider still gets its chance.
                    transcript = null;
                }
            }
            if (!transcript?.trim()) {
                return notFound('Social post has no recipe content in its caption or transcript');
            }
            const content = buildSocialMarkdown({ ...post, url, transcript });
            if (!contentLooksLikeRecipe(content)) {
                return notFound('Social post transcript does not look like a recipe');
            }
            return {
                ...ok('markdown', content, { image: post.image, source }),
                providerStats: buildProviderStats(calls, {
                    captionChars,
                    transcriptChars: transcript.trim().length,
                    transcriptMode: 'native',
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
