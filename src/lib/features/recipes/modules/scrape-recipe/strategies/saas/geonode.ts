/**
 * Geonode Scraper API — first paid provider in the chain.
 * Base URL: https://scraper.geonode.io  ·  Auth: `X-Api-Key` header.
 *
 * We request Markdown + raw HTML and let `extractFromProviderOutput` decide
 * what to do with them (JSON-LD first, cleaned Markdown otherwise).
 */
import { scraperConfig } from '../../config';
import { failed } from '../base';
import type { ScrapeStrategy } from '../base';
import {
    extractFromProviderOutput,
    type SaasProvider,
    type SaasProviderOutput
} from './base';

const BASE_URL = 'https://scraper.geonode.io';
const TIMEOUT_MS = 30_000;

/** Sync response — content lives under `data.markdown` / `data.html`. */
interface GeonodeExtractResponse {
    data?: { markdown?: string; html?: string };
}

const geonodeProvider: SaasProvider = {
    name: 'geonode',
    async fetch(url) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
            const response = await fetch(`${BASE_URL}/v1/extract`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': scraperConfig.geonode.apiKey ?? ''
                },
                body: JSON.stringify({
                    url,
                    formats: ['html', 'markdown'],
                    processing_mode: 'sync'
                }),
                signal: controller.signal
            });

            if (!response.ok) {
                const detail = await response.text().catch(() => '');
                throw new Error(`Geonode returned HTTP ${response.status}: ${detail.slice(0, 200)}`);
            }

            return normalizeGeonodeOutput((await response.json()) as GeonodeExtractResponse);
        } finally {
            clearTimeout(timer);
        }
    }
};

function normalizeGeonodeOutput(json: GeonodeExtractResponse): SaasProviderOutput {
    return {
        markdown: json.data?.markdown,
        html: json.data?.html
    };
}

export const geonodeStrategy: ScrapeStrategy = {
    name: 'geonode',
    costRank: 2,
    enabled: () => Boolean(scraperConfig.geonode.apiKey),
    async scrape(url) {
        try {
            const output = await geonodeProvider.fetch(url);
            return extractFromProviderOutput(output, url);
        } catch (error) {
            return failed('error', error instanceof Error ? error.message : String(error));
        }
    }
};
