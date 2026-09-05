/**
 * Lightweight observability for the scraping pipeline.
 *
 * Every attempt + the final outcome are emitted as a single-line structured
 * JSON log. The importing feature additionally persists strategy/format in its
 * billing metadata for durable analytics.
 */
import type { StrategyAttempt } from './types';

export interface ScrapeLogEvent {
    url: string;
    success: boolean;
    strategy?: string;
    format?: string;
    contentLength?: number;
    attempts: StrategyAttempt[];
}

export function logScrapeOutcome(event: ScrapeLogEvent): void {
    console.log('[scrape]', JSON.stringify(event));
}
