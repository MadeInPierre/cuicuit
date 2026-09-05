/**
 * Multi-strategy recipe scraper.
 *
 * Tries every registered strategy from cheapest to most expensive until one
 * produces content that passes the quality gate. Each strategy is independent
 * and optional; a failure never blocks the chain. The winning strategy's raw
 * content (JSON-LD, recipe JSON or cleaned Markdown) is passed through to the
 * LLM for parsing/enrichment downstream.
 */
import { query } from '$app/server';
import { importRecipeUrlSchema } from '../../models/schemas';
import { passesQualityGate } from './quality';
import { logScrapeOutcome } from './stats';
import type { ScrapeResult, ScrapeStrategy, StrategyAttempt } from './types';
import { directLdJsonStrategy } from './strategies/direct-ldjson';
import { recipeScrapersStrategy } from './strategies/recipe-scrapers';
import { geonodeStrategy } from './strategies/saas/geonode';
import { firecrawlStrategy } from './strategies/saas/firecrawl';

/**
 * Register new scrapers here. Order is by `costRank` (cheapest first) unless a
 * strategy declares a `urlPriority` for the URL, in which case it jumps ahead.
 */
const strategies: ScrapeStrategy[] = [
    directLdJsonStrategy, // 0 · free · direct fetch + JSON-LD
    recipeScrapersStrategy, // 1 · free · Python recipe-scrapers (optional)
    geonodeStrategy, // 2 · paid · Geonode
    firecrawlStrategy // 3 · paid · Firecrawl (fallback)
];

export const scrapeRecipeUrl = query(importRecipeUrlSchema, async ({ url }) => {
    const ordered = [...strategies].sort((a, b) => {
        const aPriority = a.urlPriority?.(url) ? 0 : 1;
        const bPriority = b.urlPriority?.(url) ? 0 : 1;
        return aPriority - bPriority || a.costRank - b.costRank;
    });

    const attempts: StrategyAttempt[] = [];

    for (const strategy of ordered) {
        if (!strategy.enabled()) {
            attempts.push({ strategy: strategy.name, status: 'skipped', latencyMs: 0 });
            continue;
        }

        const startedAt = performance.now();
        const result = await strategy.scrape(url);
        const latencyMs = Math.round(performance.now() - startedAt);

        // Failed / empty attempt → record and move on to the next strategy.
        if (result.status !== 'ok' || !result.format || !result.content) {
            attempts.push({
                strategy: strategy.name,
                status: result.status,
                latencyMs,
                errorKind: result.errorKind,
                error: result.error
            });
            continue;
        }

        // Quality gate: reject content that doesn't look like a recipe so we
        // fall through to the next (more expensive) strategy.
        if (!passesQualityGate(result.format, result.content)) {
            attempts.push({
                strategy: strategy.name,
                status: 'not_found',
                latencyMs,
                errorKind: 'low_quality',
                error: `Content did not pass the ${result.format} quality gate`
            });
            continue;
        }

        attempts.push({
            strategy: strategy.name,
            status: 'ok',
            latencyMs,
            format: result.format
        });

        const scrapeResult: ScrapeResult = {
            format: result.format,
            content: result.content,
            image: result.image,
            source: result.source,
            strategy: strategy.name,
            attempts
        };

        logScrapeOutcome({
            url,
            success: true,
            strategy: scrapeResult.strategy,
            format: scrapeResult.format,
            contentLength: scrapeResult.content.length,
            attempts
        });

        return scrapeResult;
    }

    logScrapeOutcome({ url, success: false, attempts });

    throw new Error(
        `Could not scrape a recipe from ${url}. Tried: ${attempts
            .map((attempt) => `${attempt.strategy} (${attempt.status})`)
            .join(', ')}`
    );
});
