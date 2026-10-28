import { beforeEach, describe, expect, it, vi } from 'vitest';

import { scrapeCreatorsStrategy } from './scrapecreators';

const YT_URL = 'https://www.youtube.com/watch?v=7Yo54RiBUx0';
const TT_URL = 'https://www.tiktok.com/@cook/video/1234567890123456789';
const IG_URL = 'https://www.instagram.com/reel/DJwd01lpmMs/';

const PROMO_INFO = {
    success: true,
    credits_remaining: 999,
    credits_charged: 1,
    title: 'These 15 Minute Lunches Will Change Your Life',
    description:
        'Get all of my "15 Minute Meal" recipes in my FREE Cookbook. 00:00 - Intro. ' +
        '00:31 - Tofu & Brocoli. Shop the gear below! Cuisinart 14-Cup Food processor. ' +
        'The complete breakdown and recipes for this video on my blog. '.repeat(4),
    thumbnail: 'https://img.youtube.com/vi/abc/maxresdefault.jpg',
    channel: { title: 'LifebyMikeG' },
    keywords: ['15 minute meals', 'lunch ideas']
};

const RECIPE_INFO = {
    ...PROMO_INFO,
    description:
        'Ingredients: 200g pasta, 2 eggs, 50g parmesan, 3 cloves garlic. ' +
        'Add a cup of cream and a pinch of salt. Full recipe below!'
};

const NATIVE_TRANSCRIPT = {
    success: true,
    credits_remaining: 998,
    credits_charged: 1,
    transcript_only_text:
        'hey guys today we make tofu and broccoli chop 1 onion add two cups of broth and 3 cloves of garlic'
};

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), { status });
}

function mockFetch(handler: (url: string) => Response | Promise<Response>) {
    globalThis.fetch = vi.fn(async (input: string | URL | Request) => handler(String(input))) as typeof fetch;
}

beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubEnv('SCRAPECREATORS_API_KEY', 'test-key');
});

describe('scrapeCreatorsStrategy', () => {
    it('claims social urls only (priority + support)', () => {
        // enabled() reads $env/dynamic/private, which Vitest snapshots at
        // startup — it can't be stubbed per-test, so it isn't asserted here.
        expect(scrapeCreatorsStrategy.urlPriority?.(YT_URL)).toBe(true);
        expect(scrapeCreatorsStrategy.supportsUrl?.(YT_URL)).toBe(true);
        expect(scrapeCreatorsStrategy.supportsUrl?.('https://example.com/blog/pasta')).toBe(false);
    });

    it('rejects unsupported urls without any fetch', async () => {
        const fetchMock = vi.fn(async () => jsonResponse({}));
        globalThis.fetch = fetchMock as typeof fetch;
        const result = await scrapeCreatorsStrategy.scrape('https://example.com/blog/pasta');
        expect(result.status).toBe('not_found');
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fetches the transcript when the caption only mentions recipes (promo case)', async () => {
        const seen: string[] = [];
        mockFetch((url) => {
            seen.push(url);
            if (url.includes('/v1/youtube/video/transcript')) return jsonResponse(NATIVE_TRANSCRIPT);
            if (url.includes('/v1/youtube/video')) return jsonResponse(PROMO_INFO);
            throw new Error(`unexpected call: ${url}`);
        });

        const result = await scrapeCreatorsStrategy.scrape(YT_URL);

        expect(seen).toHaveLength(2);
        expect(seen[0]).toContain('cache_max_age=30d');
        expect(result.status).toBe('ok');
        expect(result.content).toContain('## Transcript');
        expect(result.providerStats?.provider).toBe('scrapecreators');
        expect(result.providerStats?.transcriptMode).toBe('native');
        expect(result.providerStats?.captionPassedGate).toBe(false);
        expect(result.providerStats?.totalCredits).toBe(2);
        expect(result.image).toBe('https://img.youtube.com/vi/abc/maxresdefault.jpg');
    });

    it('skips the transcript when the caption already lists quantities', async () => {
        const seen: string[] = [];
        mockFetch((url) => {
            seen.push(url);
            return jsonResponse(RECIPE_INFO);
        });

        const result = await scrapeCreatorsStrategy.scrape(YT_URL);

        expect(seen).toHaveLength(1);
        expect(result.status).toBe('ok');
        expect(result.content).not.toContain('## Transcript');
        expect(result.providerStats?.transcriptMode).toBe('none');
        expect(result.providerStats?.totalCredits).toBe(1);
    });

    it('reuses the inline tiktok transcript without a second call', async () => {
        const seen: string[] = [];
        mockFetch((url) => {
            seen.push(url);
            return jsonResponse({
                success: true,
                credits_charged: 1,
                aweme_detail: {
                    desc: 'quick promo, full video on my channel, new recipes every day '.repeat(5),
                    author: { nickname: 'cook' },
                    video: { cover: { url_list: ['https://tiktokcdn.com/cover.jpg'] } }
                },
                transcript:
                    'WEBVTT\n00:00:00.340 --> 00:00:01.860\nchop 1 onion add two cups of broth and 3 cloves of garlic\n'
            });
        });

        const result = await scrapeCreatorsStrategy.scrape(TT_URL);

        expect(seen).toHaveLength(1);
        expect(seen[0]).toContain('get_transcript=true');
        expect(result.status).toBe('ok');
        // WEBVTT framing is stripped, spoken lines kept.
        expect(result.content).toContain('chop 1 onion');
        expect(result.content).not.toContain('WEBVTT');
        expect(result.content).not.toContain('-->');
        expect(result.providerStats?.transcriptMode).toBe('native');
    });

    it('normalizes instagram captions, authors and images', async () => {
        mockFetch((url) => {
            if (url.includes('/v1/instagram/post'))
                return jsonResponse({
                    success: true,
                    credits_charged: 0,
                    cached: true,
                    data: {
                        xdt_shortcode_media: {
                            owner: { username: 'cook' },
                            display_url: 'https://cdninstagram.com/display.jpg',
                            thumbnail_src: 'https://cdninstagram.com/thumb.jpg',
                            edge_media_to_caption: {
                                edges: [{ node: { text: '200g flour, 2 eggs, 100ml milk, a pinch of salt' } }]
                            }
                        }
                    }
                });
            throw new Error(`unexpected call: ${url}`);
        });

        const result = await scrapeCreatorsStrategy.scrape(IG_URL);

        expect(result.status).toBe('ok');
        expect(result.content).toContain('Author: cook');
        expect(result.content).toContain('200g flour');
        // Instagram's selected cover frame wins over display_url.
        expect(result.image).toBe('https://cdninstagram.com/thumb.jpg');
        expect(result.providerStats?.calls[0].cached).toBe(true);
        expect(result.providerStats?.totalCredits).toBe(0);
    });

    it('returns not_found when neither caption nor transcript has recipe content', async () => {
        mockFetch((url) => {
            if (url.includes('/transcript'))
                return jsonResponse({ success: true, credits_charged: 1, transcript_only_text: null });
            return jsonResponse(PROMO_INFO);
        });

        const result = await scrapeCreatorsStrategy.scrape(YT_URL);

        expect(result.status).toBe('not_found');
    });

    it('maps 404 to not_found (next provider tries) and 402 to quota error', async () => {
        mockFetch(() => jsonResponse({ message: 'gone' }, 404));
        expect((await scrapeCreatorsStrategy.scrape(YT_URL)).status).toBe('not_found');

        mockFetch(() => jsonResponse({ message: 'out of credits' }, 402));
        const quota = await scrapeCreatorsStrategy.scrape(YT_URL);
        expect(quota.status).toBe('error');
        expect(quota.errorKind).toBe('quota');
    });
});
