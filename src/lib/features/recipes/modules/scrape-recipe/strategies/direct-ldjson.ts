/**
 * Strategy 1 (cheapest): fetch the page directly from the server and look for a
 * JSON-LD Recipe in the HTML. No third-party service involved.
 */
import { fetchHtml } from '../http';
import { extractLdJsonScripts, extractRecipeImage, findRecipeNode } from '../ldjson';
import { blocked, failed, notFound, ok, type ScrapeStrategy } from './base';

export const directLdJsonStrategy: ScrapeStrategy = {
    name: 'direct-ldjson',
    costRank: 0,
    enabled: () => true,
    async scrape(url) {
        const html = await fetchHtml(url);

        if (html.outcome === 'blocked') {
            return blocked(`Direct fetch was blocked (HTTP ${html.status})`);
        }
        if (html.outcome === 'timeout') {
            return failed('timeout', 'Direct fetch timed out');
        }
        if (html.outcome === 'error') {
            return failed('http_error', `Direct fetch failed (HTTP ${html.status})`);
        }

        for (const data of extractLdJsonScripts(html.body)) {
            const recipe = findRecipeNode(data);
            if (!recipe) continue;

            return ok('ldjson', JSON.stringify(recipe), {
                image: extractRecipeImage(recipe),
                source: {
                    url: typeof recipe['url'] === 'string' ? (recipe['url'] as string) : html.finalUrl ?? url
                }
            });
        }

        return notFound('No JSON-LD Recipe found in the page');
    }
};
