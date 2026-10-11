import { beforeEach, describe, expect, it, vi } from 'vitest';

import { supadataStrategy } from './supadata';

const URL = 'https://www.youtube.com/watch?v=7Yo54RiBUx0';

const PROMO_METADATA = {
    title: 'These 15 Minute Lunches Will Change Your Life',
    description:
        'Get all of my "15 Minute Meal" recipes in my FREE Cookbook. 00:00 - Intro. ' +
        '00:31 - Tofu & Brocoli. Shop the gear below! Cuisinart 14-Cup Food processor. ' +
        'The complete breakdown and recipes for this video on my blog. '.repeat(4),
    author: { displayName: 'LifebyMikeG' },
    tags: ['15 minute meals', 'lunch ideas'],
    media: { thumbnailUrl: 'https://example.com/thumb.jpg' }
};

const RECIPE_METADATA = {
    ...PROMO_METADATA,
    description:
        'Ingredients: 200g pasta, 2 eggs, 50g parmesan, 3 cloves garlic. ' +
        'Add a cup of cream and a pinch of salt. Full recipe below!'
};

const NATIVE_TRANSCRIPT =
    'hey guys today we make tofu and broccoli chop 1 onion add two cups of broth and 3 cloves of garlic';

function jsonResponse(body: unknown, init: { status?: number; credits?: number } = {}): Response {
    const headers = new Headers();
    if (init.credits !== undefined) headers.set('x-billable-requests', String(init.credits));
    return new Response(JSON.stringify(body), { status: init.status ?? 200, headers });
}

function mockFetch(handler: (url: string) => Response | Promise<Response>) {
    globalThis.fetch = vi.fn(async (input: string | URL | Request) => handler(String(input))) as typeof fetch;
}

beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubEnv('SUPADATA_API_KEY', 'test-key');
});

describe('supadataStrategy', () => {
    it('is enabled with an api key and claims social urls', () => {
        expect(supadataStrategy.enabled()).toBe(true);
        expect(supadataStrategy.urlPriority?.(URL)).toBe(true);
        expect(supadataStrategy.urlPriority?.('https://example.com/blog/pasta')).toBe(false);
    });

    it('fetches the transcript when the caption only mentions recipes (promo case)', async () => {
        const seen: string[] = [];
        mockFetch((url) => {
            seen.push(url);
            if (url.includes('/metadata')) return jsonResponse(PROMO_METADATA, { credits: 1 });
            if (url.includes('mode=native')) return jsonResponse({ content: NATIVE_TRANSCRIPT }, { credits: 1 });
            throw new Error(`unexpected call: ${url}`);
        });

        const result = await supadataStrategy.scrape(URL);

        expect(seen.some((u) => u.includes('/metadata'))).toBe(true);
        expect(seen.some((u) => u.includes('mode=native'))).toBe(true);
        expect(seen.some((u) => u.includes('mode=auto'))).toBe(false);
        expect(result.status).toBe('ok');
        expect(result.content).toContain('## Transcript');
        expect(result.content).toContain(NATIVE_TRANSCRIPT);
        expect(result.providerStats?.transcriptMode).toBe('native');
        expect(result.providerStats?.captionPassedGate).toBe(false);
        expect(result.providerStats?.totalCredits).toBe(2);
        expect(result.image).toBe('https://example.com/thumb.jpg');
    });

    it('skips the transcript when the caption already lists quantities', async () => {
        const seen: string[] = [];
        mockFetch((url) => {
            seen.push(url);
            return jsonResponse(RECIPE_METADATA, { credits: 1 });
        });

        const result = await supadataStrategy.scrape(URL);

        expect(seen).toHaveLength(1);
        expect(result.status).toBe('ok');
        expect(result.content).not.toContain('## Transcript');
        expect(result.providerStats?.transcriptMode).toBe('none');
        expect(result.providerStats?.captionPassedGate).toBe(true);
        expect(result.providerStats?.totalCredits).toBe(1);
    });

    it('falls back to generated transcript when no native one exists (206)', async () => {
        mockFetch((url) => {
            if (url.includes('/metadata')) return jsonResponse(PROMO_METADATA, { credits: 1 });
            if (url.includes('mode=native')) return new Response('{}', { status: 206 });
            if (url.includes('mode=auto')) return jsonResponse({ content: NATIVE_TRANSCRIPT }, { credits: 4 });
            throw new Error(`unexpected call: ${url}`);
        });

        const result = await supadataStrategy.scrape(URL);

        expect(result.status).toBe('ok');
        expect(result.providerStats?.transcriptMode).toBe('generated');
        expect(result.providerStats?.totalCredits).toBe(5);
    });

    it('returns not_found when neither caption nor transcript has recipe content', async () => {
        mockFetch((url) => {
            if (url.includes('/metadata')) return jsonResponse(PROMO_METADATA, { credits: 1 });
            return jsonResponse({ content: 'hey guys welcome back to my channel vlog' }, { credits: 1 });
        });

        const result = await supadataStrategy.scrape(URL);

        expect(result.status).toBe('not_found');
    });
});
