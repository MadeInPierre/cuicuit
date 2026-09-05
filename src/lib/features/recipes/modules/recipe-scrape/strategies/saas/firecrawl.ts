/**
 * Firecrawl — second paid provider in the chain (fallback after Geonode).
 * Endpoint: POST https://api.firecrawl.dev/v2/scrape  ·  Auth: Bearer token.
 *
 * Requested formats: markdown + rawHtml; `onlyMainContent` keeps boilerplate
 * out of the Markdown; `maxAge: 0` avoids stale cached pages.
 */
import { scraperConfig } from '../../config';
import { failed } from '../base';
import type { ScrapeStrategy } from '../base';
import { extractFromProviderOutput, type SaasProvider } from './base';

const API_URL = 'https://api.firecrawl.dev/v2/scrape';
const TIMEOUT_MS = 30_000;

interface FirecrawlResponse {
    success?: boolean;
    data?: { markdown?: string; rawHtml?: string; html?: string };
    error?: string;
}

const firecrawlProvider: SaasProvider = {
    name: 'firecrawl',
    async fetch(url) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${scraperConfig.firecrawl.apiKey ?? ''}`
                },
                body: JSON.stringify({
                    url,
                    formats: ['markdown', 'rawHtml'],
                    onlyMainContent: true,
                    removeBase64Images: true,
                    maxAge: 0
                }),
                signal: controller.signal
            });

            if (!response.ok) {
                const detail = await response.text().catch(() => '');
                throw new Error(`Firecrawl returned HTTP ${response.status}: ${detail.slice(0, 200)}`);
            }

            const json = (await response.json()) as FirecrawlResponse;
            const data = json.data ?? {};

            return {
                markdown: data.markdown,
                html: data.rawHtml ?? data.html
            };
        } finally {
            clearTimeout(timer);
        }
    }
};

export const firecrawlStrategy: ScrapeStrategy = {
    name: 'firecrawl',
    costRank: 3,
    enabled: () => Boolean(scraperConfig.firecrawl.apiKey),
    async scrape(url) {
        try {
            const output = await firecrawlProvider.fetch(url);
            return extractFromProviderOutput(output, url);
        } catch (error) {
            return failed('error', error instanceof Error ? error.message : String(error));
        }
    }
};
