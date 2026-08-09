/**
 * Small factories for building `StrategyResult` values, plus the strategy
 * contract (re-exported) so strategies stay clean and readable.
 */
import type { ScrapeFormat, ScrapeSource, ScrapeStrategy, StrategyResult } from '../types';

export type { ScrapeStrategy };

export function ok(
    format: ScrapeFormat,
    content: string,
    extra: { image?: string; source?: ScrapeSource } = {}
): StrategyResult {
    return { status: 'ok', format, content, ...extra };
}

export function notFound(reason = 'No recipe content found'): StrategyResult {
    return { status: 'not_found', errorKind: 'no_content', error: reason };
}

export function blocked(reason = 'Request was blocked'): StrategyResult {
    return { status: 'blocked', errorKind: 'blocked', error: reason };
}

export function failed(errorKind: string, error: string): StrategyResult {
    return { status: 'error', errorKind, error };
}
