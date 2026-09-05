/**
 * Types shared across the multi-strategy recipe scraping pipeline.
 *
 * This module is intentionally self-contained: the only thing it exports to the
 * rest of the app is `scrapeRecipeUrl` (from the orchestrator) and these types.
 */

/** The raw shape the scraping layer hands to the LLM for parsing. */
export type ScrapeFormat = 'ldjson' | 'recipe-json' | 'markdown';

/** Unique id of every strategy registered in the orchestrator. */
export type ScrapeStrategyName = 'direct-ldjson' | 'recipe-scrapers' | 'geonode' | 'firecrawl';

/** Outcome of a single strategy attempt, before the quality gate. */
export type StrategyStatus = 'ok' | 'not_found' | 'blocked' | 'error' | 'skipped';

/** Lightweight source metadata attached to a successful scrape. */
export interface ScrapeSource {
    name?: string;
    domain?: string;
    url?: string;
}

/** Result of a single strategy attempt. */
export interface StrategyResult {
    status: 'ok' | 'not_found' | 'blocked' | 'error';
    /** Present when status === 'ok'. */
    format?: ScrapeFormat;
    /** Raw passthrough content: JSON (ldjson/recipe-json) or Markdown text. */
    content?: string;
    /** Best-guess image URL extracted from the page, when cheaply available. */
    image?: string;
    source?: ScrapeSource;
    /** Short machine-readable tag (e.g. 'blocked', 'timeout', 'no_content', 'low_quality'). */
    errorKind?: string;
    /** Human-readable detail, safe to log. */
    error?: string;
}

/** One recorded attempt, kept for observability + failover diagnostics. */
export interface StrategyAttempt {
    strategy: ScrapeStrategyName;
    status: StrategyStatus;
    latencyMs: number;
    format?: ScrapeFormat;
    errorKind?: string;
    error?: string;
}

/** The single envelope returned by `scrapeRecipeUrl` to the rest of the app. */
export interface ScrapeResult {
    format: ScrapeFormat;
    /** Raw passthrough content to be parsed/enriched by the LLM. */
    content: string;
    image?: string;
    source?: ScrapeSource;
    /** Strategy that produced the result. */
    strategy: ScrapeStrategyName;
    /** Ordered list of everything that was tried (including skipped). */
    attempts: StrategyAttempt[];
}

/**
 * Contract every strategy must implement.
 *
 * Add a new scraper (social media, video transcription, ...) by implementing
 * this interface and registering it in the orchestrator — nothing else needs to
 * change.
 */
export interface ScrapeStrategy {
    readonly name: ScrapeStrategyName;
    /** Lower = cheaper. Strategies run cheapest → most expensive. */
    readonly costRank: number;
    /**
     * Optional: return `true` to jump this strategy to the front of the queue
     * for a specific URL (e.g. known social domains).
     */
    urlPriority?(url: string): boolean;
    /** Whether the strategy is configured & available right now. */
    enabled(): boolean;
    scrape(url: string): Promise<StrategyResult>;
}
