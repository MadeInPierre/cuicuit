/**
 * Shared logic for paid SaaS scraper providers (Geonode, Firecrawl, ...).
 *
 * Both providers return Markdown + raw HTML for the same URL, so we centralize
 * the "what do we do with it" decision here:
 *   1. Look for a JSON-LD Recipe inside the raw HTML (cheapest for the LLM).
 *   2. Otherwise fall back to cleaned Markdown (labels kept).
 */
import { extractLdJsonScripts, extractRecipeImage, findRecipeNode } from '../../ldjson';
import { cleanMarkdown, htmlToText } from '../../markdown';
import type { StrategyResult } from '../../types';
import { notFound, ok } from '../base';

/** Normalized output every SaaS provider must produce. */
export interface SaasProviderOutput {
    markdown?: string;
    /** Raw HTML returned by the provider. */
    html?: string;
}

/** Provider contract: turn a URL into markdown + raw HTML. */
export interface SaasProvider {
    readonly name: string;
    fetch(url: string): Promise<SaasProviderOutput>;
}

export function extractFromProviderOutput(
    output: SaasProviderOutput,
    fallbackUrl: string
): StrategyResult {
    const { markdown, html } = output;

    // 1. Prefer a JSON-LD Recipe embedded in the raw HTML.
    if (html) {
        for (const data of extractLdJsonScripts(html)) {
            const recipe = findRecipeNode(data);
            if (!recipe) continue;

            return ok('ldjson', JSON.stringify(recipe), {
                image: extractRecipeImage(recipe),
                source: { url: typeof recipe['url'] === 'string' ? (recipe['url'] as string) : fallbackUrl }
            });
        }
    }

    // 2. Fall back to cleaned Markdown (or a light HTML→text conversion).
    const text = markdown ? cleanMarkdown(markdown) : html ? htmlToText(html) : '';
    if (text.trim().length > 0) {
        return ok('markdown', text);
    }

    return notFound('Provider returned no usable content');
}
