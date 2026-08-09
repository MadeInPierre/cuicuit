/**
 * Strategy 2 (free): the optional Python `recipe-scrapers` container, which can
 * parse a wider set of sites via its per-site HTML scraping rules. Fully
 * optional — skipped when PYTHON_SCRAPER_URL is unset or the call fails.
 */
import { scraperConfig } from '../config';
import { failed, notFound, ok, type ScrapeStrategy } from './base';

/** Loose mirror of the Python service response (kept in sync with scraper/main.py). */
interface RecipeScrapersPayload {
    strategy?: string;
    source?: { name?: string; domain?: string; url?: string };
    title?: string;
    description?: string;
    image?: string;
    author?: string;
    servings?: string;
    ingredients?: { ingredients: string[]; purpose?: string | null }[];
    instructions?: string[];
    time?: { prep?: string | null; cook?: string | null; rest?: string | null; total?: string | null };
    ratings?: string;
    category?: string;
    language?: string;
}

const TIMEOUT_MS = 15_000;

export const recipeScrapersStrategy: ScrapeStrategy = {
    name: 'recipe-scrapers',
    costRank: 1,
    enabled: () => Boolean(scraperConfig.python.baseUrl),
    async scrape(url) {
        const baseUrl = scraperConfig.python.baseUrl;
        if (!baseUrl) return failed('not_configured', 'PYTHON_SCRAPER_URL is not set');

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
            const response = await fetch(`${baseUrl}/scrape-recipe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
                signal: controller.signal
            });

            if (!response.ok) {
                const detail = await response.text().catch(() => '');
                return failed(
                    'http_error',
                    `Python scraper returned HTTP ${response.status}: ${detail.slice(0, 200)}`
                );
            }

            const data = (await response.json()) as RecipeScrapersPayload;
            const title = data.title?.trim();
            const instructions = Array.isArray(data.instructions) ? data.instructions : [];

            if (!title || instructions.length === 0) {
                return notFound('Python scraper returned no usable recipe');
            }

            return ok('recipe-json', JSON.stringify(data), {
                image: data.image || undefined,
                source: data.source
            });
        } catch (error) {
            const aborted = (error as Error).name === 'AbortError';
            return aborted
                ? failed('timeout', 'Python scraper timed out')
                : failed('error', error instanceof Error ? error.message : String(error));
        } finally {
            clearTimeout(timer);
        }
    }
};
