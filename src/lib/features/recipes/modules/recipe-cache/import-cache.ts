import { version } from '$app/env';
import type { Database, Json } from '$lib/shared/db/supabase.types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { EnrichedRecipeOutput } from '../recipe-enrich/enrich-recipe.remote';
import type {
	ScrapeFormat,
	ScrapeSource,
	ScrapeStrategyName,
	StrategyAttempt
} from '../recipe-scrape/types';

/**
 * Bump this whenever scrape or enrichment logic changes, so a future cache
 * invalidation pass can tell which version produced each cached entry.
 */
const IMPORT_CACHE_VERSION = version;

/**
 * Everything worth keeping from a scrape, enough to resume the import without
 * re-calling any external scraper.
 */
export type ImportScrapeStats = {
	strategy: ScrapeStrategyName;
	format: ScrapeFormat;
	attempts: StrategyAttempt[];
	source?: ScrapeSource | null;
	image_url?: string | null;
	content_length: number;
};

/** How the recipe was enriched by the LLM (provider + token usage). */
export type ImportLlmStats = {
	provider: string;
	fallback_used: boolean;
	usage: { input_tokens: number | null; output_tokens: number | null } | null;
};

type CacheRow = Database['public']['Tables']['recipes_cache']['Row'];

/**
 * Canonicalizes a URL so the same recipe maps to the same cache key no matter
 * how it's pasted (tracking params, fragments, trailing slash, casing, ports).
 */
export function normalizeImportUrl(url: string): string {
	const parsed = new URL(url);
	parsed.hash = '';
	parsed.username = '';
	parsed.password = '';
	parsed.protocol = parsed.protocol.toLowerCase();
	parsed.hostname = parsed.hostname.toLowerCase();
	if (
		(parsed.protocol === 'http:' && parsed.port === '80') ||
		(parsed.protocol === 'https:' && parsed.port === '443')
	) {
		parsed.port = '';
	}
	parsed.searchParams.forEach((_value, key) => {
		const lowercase = key.toLowerCase();
		if (
			lowercase.startsWith('utm_') ||
			lowercase.startsWith('mtm_') ||
			['gclid', 'fbclid', 'ref', 'source', 'spm'].includes(lowercase)
		) {
			parsed.searchParams.delete(key);
		}
	});
	return parsed.toString().replace(/\/+$/, '');
}

/** Stable cache key for a URL: sha256 of its canonical form. */
export async function buildImportCacheKey(url: string): Promise<string> {
	const digest = await crypto.subtle.digest(
		'SHA-256',
		new TextEncoder().encode(normalizeImportUrl(url))
	);
	return Array.from(new Uint8Array(digest))
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');
}

/** Fetches a previously saved import state, if any. */
export async function getCachedImport(
	supabase: SupabaseClient<Database>,
	cacheKey: string
): Promise<CacheRow | null> {
	const { data } = await supabase
		.from('recipes_cache')
		.select('*')
		.eq('cache_key', cacheKey)
		.maybeSingle();
	return data;
}

/** Persists the scrape output so the parser stage is never repeated. */
export async function saveImportScrape(
	supabase: SupabaseClient<Database>,
	input: {
		cacheKey: string;
		sourceUrl: string;
		scrapeOutput: string;
		scrapeStats: ImportScrapeStats;
	}
): Promise<string> {
	const { data, error } = await supabase
		.from('recipes_cache')
		.upsert(
			{
				cache_key: input.cacheKey,
				source_url: input.sourceUrl,
				app_version: IMPORT_CACHE_VERSION,
				scrape_output: input.scrapeOutput,
				scrape_stats: input.scrapeStats as unknown as Json
			},
			{ onConflict: 'cache_key' }
		)
		.select('id')
		.single();
	if (error || !data) throw new Error('Failed to cache the scraped recipe.');
	return data.id;
}

/** Persists the LLM enrichment output so the LLM is never re-called for a cached recipe. */
export async function saveImportLlm(
	supabase: SupabaseClient<Database>,
	cacheId: string,
	llmOutput: EnrichedRecipeOutput,
	llmStats: ImportLlmStats
): Promise<void> {
	const { error } = await supabase
		.from('recipes_cache')
		.update({
			llm_output: llmOutput as unknown as Json,
			llm_stats: llmStats as unknown as Json
		})
		.eq('id', cacheId);
	if (error) throw error;
}

/** Typed accessors for the JSONB columns. */
export function getScrapeStats(row: CacheRow | null): ImportScrapeStats | null {
	return row?.scrape_stats as ImportScrapeStats | null;
}

export function getLlmOutput(row: CacheRow | null): EnrichedRecipeOutput | null {
	return row?.llm_output as EnrichedRecipeOutput | null;
}
