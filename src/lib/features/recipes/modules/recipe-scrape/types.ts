/**
 * Types shared across the multi-strategy recipe scraping pipeline.
 *
 * This module is intentionally self-contained: the only thing it exports to the
 * rest of the app is `scrapeRecipeUrl` (from `core/operations/recipes/scrape-helpers.ts`) and these types.
 */

/** The raw shape the scraping layer hands to the LLM for parsing. */
export type ScrapeFormat = 'ldjson' | 'recipe-json' | 'markdown';

/** Unique id of every strategy registered in the orchestrator. */
export type ScrapeStrategyName =
	| 'direct-ldjson'
	| 'recipe-scrapers'
	| 'geonode'
	| 'firecrawl'
	| 'supadata'
	| 'scrapecreators';

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
	/** Provider cost + decision trail (e.g. Supadata calls). Dropped unless status === 'ok'. */
	providerStats?: ScrapeProviderStats | null;
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
	/** Provider cost + decision trail (persisted in `recipes_cache.scrape_stats`). */
	providerStats?: ScrapeProviderStats | null;
}

/**
 * One billed provider HTTP call, for cost observability.
 * Credits come from the provider response itself (Supadata's
 * `x-billable-requests` header — async-job 202 responses carry a precharge
 * estimate, polls report 0 — or ScrapeCreators' `credits_charged` body field).
 */
export interface ProviderCallStat {
	endpoint: string;
	mode?: string;
	httpStatus: number | null;
	credits: number | null;
	latencyMs: number;
	/** Chars of usable content from this call. */
	chars: number;
	/** Whether the provider served this from cache (0 credits). */
	cached?: boolean;
	/** Async job polls performed (always free). */
	polls?: number;
}

/** Cost + decision trail of a provider scrape, persisted in `scrape_stats`. */
export interface ScrapeProviderStats {
	provider: 'supadata' | 'scrapecreators';
	calls: ProviderCallStat[];
	captionChars: number;
	transcriptChars: number;
	/** Which transcript (if any) made it into the content. */
	transcriptMode: 'none' | 'native' | 'generated';
	/** Whether the caption alone passed the strict ingredient gate. */
	captionPassedGate: boolean;
	/** Sum of billed credits across calls (null when unknown). */
	totalCredits: number | null;
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
	/**
	 * Optional: return `false` for URLs this strategy can never handle, so the
	 * orchestrator skips it without a wasted call (e.g. social-only providers
	 * on blog URLs). Absence means "may handle any URL".
	 */
	supportsUrl?(url: string): boolean;
	/** Whether the strategy is configured & available right now. */
	enabled(): boolean;
	scrape(url: string): Promise<StrategyResult>;
}
