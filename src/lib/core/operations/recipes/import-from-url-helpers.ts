import { version } from '$app/env';
import type { SupabaseClient } from '@supabase/supabase-js';

import { buildCustomIngredientName } from '$lib/features/ingredients/utils/ingredient-display';
import type { ParsedSearchInput } from '$lib/features/recipes/modules/parse-ingredients/parse';
import type { IngredientProcessed } from '$lib/features/recipes/modules/parse-ingredients/process';
import { sanitizeEnrichedRecipeOutput } from '$lib/features/recipes/modules/recipe-enrich/enrich-recipe';
import { enrichRawRecipe, enrichTextRecipe, type EnrichedRecipeOutput } from './enrich-helpers.js';
import { scrapeRecipeUrl } from './scrape-helpers.js';
import type {
	ScrapeFormat,
	ScrapeSource,
	ScrapeStrategyName,
	StrategyAttempt
} from '$lib/features/recipes/modules/recipe-scrape/types';
import type { Database, Json } from '$lib/shared/db/supabase.types';
import type { PublicRecipesRow } from '$lib/shared/db/supazod.schemas';
import {
	DEFAULT_LANGUAGE,
	normalizeLanguageCode,
	type LanguageCode
} from '$lib/shared/language.js';
import { unitToRegionized } from '$lib/shared/utils/quantity';

import { resolveLanguageId } from '../languages/resolve.js';
import { runOp, type OpCtx } from '../registry.js';
import type { MatchIngredientsInput, MatchIngredientsResult } from '../ingredients/match.js';
import { uploadImageToRecipe } from './upload-image-helper.js';

// M2: co-located helpers for the `recipes.import-from-url` /
// `recipes.import-from-text` / `recipes.add-examples` ops. Contents:
// 1. a COPY of `features/recipes/modules/recipe-cache/import-cache.ts` (the original
//    stays in place — other importers may use it);
// 2. the credit-free import logic moved from `features/recipes/actions/import-recipe.ts`
//    (that module is deleted once the remotes are thinned — verified zero importers).
// 3. (Phase 1d) the scrape orchestration + LLM enrichment pipeline, folded here
//    from the `*.remote.ts` modules as `./scrape-helpers.ts` /
//    `./enrich-helpers.ts` (plain helpers, not ops). Those remotes are now thin
//    shims delegating to core; this server-only module imports core directly.
// Server-only (scrape/enrich helpers, admin writes). Not an op.

// ==========================================
// 1. Import cache (canonical implementation; former features/... copy deleted)
// ==========================================

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
	const raw = row?.llm_output as EnrichedRecipeOutput | null;
	// Re-sanitize cached output: caches written before the sanitizer was added
	// may still contain null/empty fields for NOT NULL columns.
	return raw ? sanitizeEnrichedRecipeOutput(raw) : null;
}

// ==========================================
// 2. Reusable import helpers (moved from import-recipe.ts)
// ==========================================

export type ImportUrlResult = { id: string; isComplete: boolean };

export type ImportUrlContext = {
	supabase: SupabaseClient<Database>;
	admin: SupabaseClient<Database>;
	userId: string;
	url: string;
	lang: LanguageCode;
};

export type ImportTextContext = {
	supabase: SupabaseClient<Database>;
	admin: SupabaseClient<Database>;
	userId: string;
	text: string;
	lang: LanguageCode;
};

/**
 * Which language the ingredient catalog is matched against during an import.
 *
 * Always the recipe's own written language as reported by the LLM — never the
 * importer's space language (a French user can import a German recipe). When
 * the LLM output has no usable language, falls back to the space language
 * with a loud warning: matching in the wrong language silently produces
 * custom (unlinked) ingredients.
 */
export function resolveRecipeMatchLang(llmLang: unknown, fallbackLang: LanguageCode): LanguageCode {
	const detected = normalizeLanguageCode(llmLang);
	if (!detected) {
		console.warn(
			`Import: unrecognized recipe language (${JSON.stringify(llmLang)}), ` +
				`matching ingredients as "${fallbackLang}" instead — expect custom ingredients.`
		);
		return fallbackLang;
	}
	return detected;
}

/**
 * Enriches and matches a raw list of ingredients against the database matches.
 */
export async function processAndMatchIngredients(
	supabase: SupabaseClient<Database>,
	enrichedIngredients: ParsedSearchInput[],
	lang: LanguageCode,
	userId: string
): Promise<IngredientProcessed[]> {
	const matchData = await runOp<MatchIngredientsInput, MatchIngredientsResult>(
		'ingredients.match',
		{ supabase, admin: supabase, userId, source: 'app' },
		{
			ingredientStrings: enrichedIngredients
				.filter((p) => p.ingredientText && p.ingredientText.trim().length > 0)
				.map((p) => p.ingredientText || 'Unknown'),
			lang: lang || DEFAULT_LANGUAGE
		}
	);

	return enrichedIngredients.map(
		(p, i) =>
			({
				sourceText: p.sourceText || 'Unknown',
				parsed: p,
				matches: (matchData.matches[i].bestMatches || []) as IngredientProcessed['matches']
			}) satisfies IngredientProcessed
	);
}

/**
 * Updates an existing recipe with data received from the LLM enrichment process.
 */
export async function saveEnrichedRecipe(
	supabase: SupabaseClient<Database>,
	recipeId: string,
	enrichedRecipe: EnrichedRecipeOutput
): Promise<void> {
	// Get the recipe's language database ID
	const { id: langId } = await resolveLanguageId(
		supabase,
		normalizeLanguageCode(enrichedRecipe.lang) ?? DEFAULT_LANGUAGE
	);

	const title =
		enrichedRecipe.recipe.title.length >= 47
			? `${enrichedRecipe.recipe.title.slice(0, 47)}...`
			: enrichedRecipe.recipe.title;

	const { data: enrichedInsertData, error: enrichedInsertError } = await supabase
		.from('recipes')
		.update({
			language_id: langId,
			title,
			short_title: enrichedRecipe.recipe.short_title,
			description: enrichedRecipe.recipe.description,
			servings: enrichedRecipe.recipe.servings,
			time_prep_minutes: enrichedRecipe.recipe.time_prep_minutes,
			time_cook_minutes: enrichedRecipe.recipe.time_cook_minutes,
			time_rest_minutes: enrichedRecipe.recipe.time_rest_minutes,
			cleanup_level: enrichedRecipe.recipe.cleanup_level,
			cost_level: enrichedRecipe.recipe.cost_level,
			skill_level: enrichedRecipe.recipe.skill_level,
			effort_level: enrichedRecipe.recipe.effort_level,
			courses: enrichedRecipe.recipe.courses,
			cuisines: enrichedRecipe.recipe.cuisines,
			times_of_day: enrichedRecipe.recipe.times_of_day,
			tools: enrichedRecipe.recipe.tools,
			steps: enrichedRecipe.recipe.steps,
			notes: enrichedRecipe.recipe.notes,
			updated_at: new Date().toISOString()
		} satisfies Partial<PublicRecipesRow>)
		.eq('id', recipeId)
		.select()
		.single();

	if (enrichedInsertError || !enrichedInsertData) {
		console.error('Error inserting enriched recipe data:', enrichedInsertError);
		throw new Error('Failed to insert enriched recipe data.');
	}
}

/**
 * Iterates through processed ingredients and hooks them up to the recipe-ingredient join table.
 */
export async function insertRecipeIngredients(
	supabase: SupabaseClient<Database>,
	recipeId: string,
	processedIngredients: IngredientProcessed[]
): Promise<void> {
	if (!processedIngredients || processedIngredients.length === 0) {
		console.warn('No ingredients matched during import.');
		return;
	}

	console.log('Matched ingredients for import:', processedIngredients);

	for (const processed of processedIngredients) {
		const bestMatch = processed.matches?.[0];
		// No catalog match: keep the ingredient as a custom (free-text) one
		// instead of dropping it, so imports never silently lose ingredients.
		const customName = bestMatch
			? null
			: buildCustomIngredientName(processed.parsed.ingredientText);

		const { data: ingredientInsertData, error: ingredientInsertError } = await supabase
			.from('recipe_ingredients')
			.insert([
				{
					recipe_id: recipeId,
					raw_input: processed.sourceText,
					ingredient_id: bestMatch?.id ?? null,
					custom_name: customName,
					quantity: processed.parsed.quantity?.amount || 1,
					unit: unitToRegionized(processed.parsed.quantity?.unitKey || 'whole', 'eu'), // TODO region, Store a truely standardized unit (regionized)
					details: processed.parsed.description || '',
					preparation: processed.parsed.preparation || '',
					is_optional: processed.parsed.isOptional || false,
					notes: ''
				} satisfies Database['public']['Tables']['recipe_ingredients']['Insert']
			])
			.select()
			.single();

		if (ingredientInsertError || !ingredientInsertData) {
			console.error(
				'Error inserting imported ingredient:',
				processed.sourceText,
				ingredientInsertError
			);
		}
	}
}

/**
 * Creates the canonical (author-less) recipe row for a cached import, so a
 * recipe only ever has to be scraped/enriched/parsed once.
 */
export async function insertImportedRecipe(
	supabase: SupabaseClient<Database>,
	input: {
		sourceType: Database['public']['Tables']['recipes']['Row']['source_type'];
		sourceUrl: string;
		cacheId: string;
		enriched: EnrichedRecipeOutput;
	}
): Promise<string> {
	// Get the recipe's language database ID
	const { id: langId } = await resolveLanguageId(
		supabase,
		normalizeLanguageCode(input.enriched.lang) ?? DEFAULT_LANGUAGE
	);

	const title =
		input.enriched.recipe.title.length >= 47
			? `${input.enriched.recipe.title.slice(0, 47)}...`
			: input.enriched.recipe.title;

	const { data, error } = await supabase
		.from('recipes')
		.insert({
			author_id: null,
			cache_id: input.cacheId,
			source_type: input.sourceType,
			source_url: input.sourceUrl,
			title,
			short_title: input.enriched.recipe.short_title,
			description: input.enriched.recipe.description,
			notes: input.enriched.recipe.notes,
			image_ids: [],
			slug: '', // Will be generated by a db trigger

			// Filters (single select enums)
			cleanup_level: input.enriched.recipe.cleanup_level,
			cost_level: input.enriched.recipe.cost_level,
			effort_level: input.enriched.recipe.effort_level,
			skill_level: input.enriched.recipe.skill_level,

			// Filters (multi select enums)
			courses: input.enriched.recipe.courses,
			cuisines: input.enriched.recipe.cuisines,
			times_of_day: input.enriched.recipe.times_of_day,
			tools: input.enriched.recipe.tools,

			// Cook times
			time_prep_minutes: input.enriched.recipe.time_prep_minutes,
			time_cook_minutes: input.enriched.recipe.time_cook_minutes,
			time_rest_minutes: input.enriched.recipe.time_rest_minutes,

			// Servings
			servings: input.enriched.recipe.servings,

			// Steps
			steps: input.enriched.recipe.steps,
			language_id: langId
		} satisfies Database['public']['Tables']['recipes']['Insert'])
		.select('id')
		.single();

	if (error || !data) {
		console.error('Error creating cache recipe:', error);
		throw new Error('Failed to create the cached recipe.');
	}

	return data.id;
}

/** Finds the author-less template recipe stored for a cache entry, if any. */
export async function findTemplateRecipeId(
	supabase: SupabaseClient<Database>,
	cacheId: string
): Promise<string | null> {
	const { data } = await supabase
		.from('recipes')
		.select('id')
		.is('author_id', null)
		.eq('cache_id', cacheId)
		.limit(1)
		.maybeSingle();
	return data?.id ?? null;
}

/** Copies the recipe-ingredient rows of one recipe into another. */
export async function copyRecipeIngredients(
	supabase: SupabaseClient<Database>,
	fromRecipeId: string,
	toRecipeId: string
): Promise<void> {
	const { data: ingredients, error } = await supabase
		.from('recipe_ingredients')
		.select(
			'ingredient_id, custom_name, quantity, unit, notes, details, raw_input, is_optional, preparation'
		)
		.eq('recipe_id', fromRecipeId);

	if (error || !ingredients?.length) return;

	const { error: insertError } = await supabase
		.from('recipe_ingredients')
		.insert(ingredients.map((ingredient) => ({ ...ingredient, recipe_id: toRecipeId })));

	if (insertError) {
		console.error('Error copying ingredients to duplicated recipe:', insertError);
	}
}

/**
 * Duplicates a cached template recipe (and its ingredients) for the requesting
 * user, so they get their own editable copy.
 */
export async function duplicateRecipeForUser(
	supabase: SupabaseClient<Database>,
	templateRecipeId: string,
	userId: string
): Promise<string> {
	const { data: template, error: templateError } = await supabase
		.from('recipes')
		.select('*')
		.eq('id', templateRecipeId)
		.single();
	if (templateError || !template) throw new Error('Cached template recipe not found.');

	const { data, error } = await supabase
		.from('recipes')
		.insert({
			author_id: userId,
			cache_id: template.cache_id,
			source_type: template.source_type,
			source_url: template.source_url,
			title: template.title,
			short_title: template.short_title,
			description: template.description,
			notes: template.notes,
			image_ids: [],
			slug: '', // Will be re-generated by a db trigger
			language_id: template.language_id,
			time_prep_minutes: template.time_prep_minutes,
			time_cook_minutes: template.time_cook_minutes,
			time_rest_minutes: template.time_rest_minutes,
			effort_level: template.effort_level,
			skill_level: template.skill_level,
			cleanup_level: template.cleanup_level,
			cost_level: template.cost_level,
			servings: template.servings,
			steps: template.steps,
			times_of_day: template.times_of_day,
			courses: template.courses,
			cuisines: template.cuisines,
			tools: template.tools
		} satisfies Database['public']['Tables']['recipes']['Insert'])
		.select('id')
		.single();
	if (error || !data) throw new Error('Failed to duplicate the cached recipe.');

	await copyRecipeIngredients(supabase, templateRecipeId, data.id);
	return data.id;
}

// ==========================================
// 3. Core import logic (credit-free)
//
// The actual scraping/enriching/duplicating work. Never touches credits
// (no afford check, no `consume_credits` call) — the import ops apply the
// credit gate around these generators, and `recipes.add-examples` reuses the
// URL core without charging.
// ==========================================

/**
 * Imports a recipe from a URL, reusing the shared cache so a recipe is only
 * scraped/enriched/parsed once. Yields progress steps (numbers) and finally the
 * resulting recipe id.
 */
export async function* importRecipeFromUrlCore(
	context: ImportUrlContext
): AsyncGenerator<number | ImportUrlResult> {
	const { admin, userId, url, lang } = context;

	// Cached/template rows (author-less) live outside the user's RLS reach, so
	// all cache & template writes go through the server-side admin client.

	// Step 0: Finding the recipe — reuse the cached scrape, or scrape & persist it.
	yield 0;
	const cacheKey = await buildImportCacheKey(url);
	const cache = await getCachedImport(admin, cacheKey);
	let cacheId = cache?.id ?? null;
	const sourceUrl = cache?.source_url ?? normalizeImportUrl(url);

	let scrapeStats = getScrapeStats(cache);
	let scrapeOutput = cache?.scrape_output ?? null;
	let imageUrl = scrapeStats?.image_url ?? null;

	if (!scrapeOutput || !scrapeStats) {
		const scraped = await scrapeRecipeUrl({ url });
		console.log('Scraped recipe:', scraped.strategy, scraped.format, scraped.attempts);

		scrapeOutput = scraped.content;
		scrapeStats = {
			strategy: scraped.strategy,
			format: scraped.format,
			attempts: scraped.attempts,
			source: scraped.source ?? null,
			image_url: scraped.image ?? null,
			content_length: scraped.content.length
		};
		imageUrl = scraped.image ?? null;

		cacheId = await saveImportScrape(admin, {
			cacheKey,
			sourceUrl,
			scrapeOutput,
			scrapeStats
		});
	}

	// Step 1: Guessing filters and missing details — reuse the cached LLM
	// output, or enrich & persist it (so a failed LLM is retried on next import).
	yield 1;
	let llmOutput = getLlmOutput(cache);
	if (!llmOutput) {
		try {
			const enriched = await enrichRawRecipe(
				{
					content: scrapeOutput,
					format: scrapeStats.format
				},
				userId
			);
			llmOutput = enriched.output;
			if (cacheId) {
				await saveImportLlm(admin, cacheId, llmOutput, {
					provider: enriched.stats.provider,
					fallback_used: enriched.stats.fallbackUsed,
					usage: {
						input_tokens: enriched.stats.inputTokens,
						output_tokens: enriched.stats.outputTokens
					}
				});
			}
		} catch (error) {
			console.error('Failed to parse scraped recipe with the LLM:', error);
			// The scrape is already cached — the LLM will be retried next time.
			throw new Error(
				'Failed to parse the scraped recipe with the LLM. Please try again — the recipe was saved.'
			);
		}
	}

	// The LLM may have extracted an image URL from the raw content when the
	// scraper couldn't (e.g. Geonode/Firecrawl returning raw markdown).
	imageUrl = imageUrl || llmOutput.image || null;

	// Step 2: Recognizing ingredients & units — create the template recipe and
	// its ingredients once, then duplicate everything for the user.
	yield 2;
	let templateId = await findTemplateRecipeId(admin, cacheId!);
	if (!templateId) {
		templateId = await insertImportedRecipe(admin, {
			sourceType: 'website',
			sourceUrl,
			cacheId: cacheId!,
			enriched: llmOutput
		});

		const processedIngredients = await processAndMatchIngredients(
			admin,
			llmOutput.ingredients,
			resolveRecipeMatchLang(llmOutput.lang, lang),
			userId
		);
		await insertRecipeIngredients(admin, templateId, processedIngredients);
	}

	// The user's readable/editable copy is built via the admin client too, but
	// ownership is set to the requesting user so their own client can read it.
	const userRecipeId = await duplicateRecipeForUser(admin, templateId, userId);
	console.log('Duplicated cached recipe to user copy:', userRecipeId);

	// Step 3: Upload the recipe image to the user's copy
	yield 3;
	if (imageUrl) {
		try {
			const imgResponse = await fetch(imageUrl);
			const blob = await imgResponse.blob();
			const file = new File([blob], 'imported-image.jpg', { type: blob.type });
			await uploadImageToRecipe(admin, file, userRecipeId, []);
		} catch (error) {
			console.warn('Failed to download & upload the image, skipping:', error);
		}
	}

	// TODO Complete is true hoping the recipe is good, but should do a last zod check
	yield { id: userRecipeId, isComplete: true };
}

/**
 * Imports a recipe from free-form text. Creates a draft recipe, enriches it
 * with the LLM, then saves the enriched data + ingredients. Returns with
 * `isComplete: false` so the user reviews the imported data.
 */
export async function* importRecipeFromTextCore(
	context: ImportTextContext
): AsyncGenerator<number | ImportUrlResult> {
	const { supabase, admin, text, lang } = context;

	// The draft recipe and its data are written through the admin client so that
	// consume_credits (only callable by service_role) can be used and the recipe
	// writes don't depend on client-side RLS.
	yield 0;
	const { lang: normalizedLang } = await resolveLanguageId(supabase, lang);

	// Draft creation goes through the core op (same validation + confirmed-email
	// gate as the manual flow).
	const opCtx: OpCtx = {
		supabase,
		admin,
		userId: context.userId,
		source: 'app'
	};
	const recipeId = await runOp('recipes.create-draft', opCtx, {
		sourceType: 'user-manual',
		lang: normalizedLang,
		title: 'Creating recipe...'
	});
	if (!recipeId || typeof recipeId !== 'string') {
		throw new Error('Failed to create draft recipe.');
	}

	// Step 1: Organizing your recipe
	yield 1;
	let enrichedRecipe: EnrichedRecipeOutput;
	try {
		const result = await enrichTextRecipe({ text }, context.userId);
		enrichedRecipe = result.output;
	} catch {
		throw new Error('LLM errored, cannot import text recipe without LLM');
	}

	// Step 2: Finding ingredients & units
	yield 2;
	const processedIngredients = await processAndMatchIngredients(
		admin,
		enrichedRecipe.ingredients,
		resolveRecipeMatchLang(enrichedRecipe.lang, normalizedLang),
		context.userId
	);
	console.log('Enriched recipe from LLM:', enrichedRecipe, processedIngredients);

	await saveEnrichedRecipe(admin, recipeId, enrichedRecipe);
	await insertRecipeIngredients(admin, recipeId, processedIngredients);

	// TODO Complete is true hoping the recipe is good, but should do a last zod check
	yield { id: recipeId, isComplete: true };
}
