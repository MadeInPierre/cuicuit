import { getRequestEvent, query } from '$app/server';
import { canUserAfford } from '$lib/features/auth/queries/get-user-credit-balance';
import { FEATURE_COSTS, type PaidFeatureKey } from '$lib/features/billing/consts';
import { consumeCredits } from '$lib/features/billing/server/consume-credits.remote';
import { serverIsUserAuthenticated } from '$lib/features/billing/server/utils/is-user-authenticated';
import { languageKeySchema, languages, type LanguageKey } from '$lib/features/user-settings/consts';
import type { Database } from '$lib/shared/db/supabase.types';
import type { PublicRecipesRow } from '$lib/shared/db/supazod.schemas';
import { unitToRegionized } from '$lib/shared/utils/quantity';
import type { SupabaseClient } from '@supabase/supabase-js';
import z from 'zod';
import { matchIngredients } from '../modules/parse-ingredients/match';
import type { ParsedSearchInput } from '../modules/parse-ingredients/parse';
import type { IngredientProcessed } from '../modules/parse-ingredients/process';
import {
	buildImportCacheKey,
	getCachedImport,
	getLlmOutput,
	getScrapeStats,
	normalizeImportUrl,
	saveImportLlm,
	saveImportScrape
} from '../modules/recipe-cache/import-cache';
import {
	enrichRawRecipe,
	enrichTextRecipe,
	type EnrichedRecipeOutput
} from '../modules/recipe-enrich/enrich-recipe.remote';
import { scrapeRecipeUrl } from '../modules/recipe-scrape/orchestrator.remote';
import { getLanguageId } from '../queries/get-language-id';
import { createDraftRecipe } from './create-draft-recipe.remote';
import { uploadRecipeImage } from './upload-recipe-image';

// ==========================================
// Reusable Helper Functions
// ==========================================

/**
 * Enriches and matches a raw list of ingredients against the database matches.
 */
async function processAndMatchIngredients(
	supabase: SupabaseClient<Database>,
	enrichedIngredients: ParsedSearchInput[],
	lang: LanguageKey
): Promise<IngredientProcessed[]> {
	const { data: matchData, error: matchError } = await matchIngredients(
		supabase,
		enrichedIngredients
			.filter((p) => p.ingredientText && p.ingredientText.trim().length > 0)
			.map((p) => p.ingredientText || 'Unknown'),
		lang || 'fr-FR'
	);

	if (matchError) throw matchError;

	return enrichedIngredients.map(
		(p, i) =>
			({
				sourceText: p.sourceText || 'Unknown',
				parsed: p,
				matches: matchData?.matches[i].bestMatches || []
			}) satisfies IngredientProcessed
	);
}

/**
 * Updates an existing recipe with data received from the LLM enrichment process.
 */
async function saveEnrichedRecipe(
	supabase: SupabaseClient<Database>,
	recipeId: string,
	enrichedRecipe: EnrichedRecipeOutput
): Promise<void> {
	// Get the recipe's language database ID
	const langId =
		Object.entries(languages).find(([key]) => key === enrichedRecipe.lang)?.[1].id || 1;

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
async function insertRecipeIngredients(
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
		if (!bestMatch) {
			console.warn('No match found for ingredient, skipping add to DB:', processed.sourceText);
			continue;
		}

		const { data: ingredientInsertData, error: ingredientInsertError } = await supabase
			.from('recipe_ingredients')
			.insert([
				{
					recipe_id: recipeId,
					raw_input: processed.sourceText,
					ingredient_id: bestMatch.id,
					quantity: processed.parsed.quantity?.amount || 1,
					unit: unitToRegionized(processed.parsed.quantity?.unitKey || 'whole', 'eu'), // TODO region, Store a truely standardized unit (regionized)
					details: processed.parsed.description || '',
					preparation: processed.parsed.preparation || '',
					is_optional: processed.parsed.isOptional || false,
					notes: ''
				} satisfies Database['public']['Tables']['recipe_ingredients']['Row']
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
async function insertImportedRecipe(
	supabase: SupabaseClient<Database>,
	input: {
		sourceType: Database['public']['Tables']['recipes']['Row']['source_type'];
		sourceUrl: string;
		cacheId: string;
		enriched: EnrichedRecipeOutput;
	}
): Promise<string> {
	// Get the recipe's language database ID
	const langId =
		Object.entries(languages).find(([key]) => key === input.enriched.lang)?.[1].id || 1;

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
async function findTemplateRecipeId(
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
async function copyRecipeIngredients(
	supabase: SupabaseClient<Database>,
	fromRecipeId: string,
	toRecipeId: string
): Promise<void> {
	const { data: ingredients, error } = await supabase
		.from('recipe_ingredients')
		.select('ingredient_id, quantity, unit, notes, details, raw_input, is_optional, preparation')
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
async function duplicateRecipeForUser(
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
// Main Exported Functions
// ==========================================

export const importRecipeFromUrl = query.live(
	z.object({
		spaceId: z.string(),
		url: z.url(),
		fallbackLang: languageKeySchema
	}),
	async function* ({ spaceId, url, fallbackLang }) {
		console.log('Importing recipe from URL', spaceId, url, fallbackLang);

		// Check authentication
		const event = getRequestEvent();
		const { userId, isValid } = await serverIsUserAuthenticated(event.locals.supabase);
		if (!isValid) throw new Error('User must be confirmed with a valid email.');

		// Check credit balance
		const authorized = await canUserAfford(
			event.locals.supabase,
			userId,
			FEATURE_COSTS.import_recipe_from_website.seeds
		);
		if (!authorized) throw new Error('User cannot afford the feature.');

		// Cached/template rows (author-less) live outside the user's RLS reach, so
		// all cache & template writes go through the server-side admin client.
		const admin = event.locals.supabaseAdmin;

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
				const enriched = await enrichRawRecipe({
					content: scrapeOutput,
					format: scrapeStats.format
				});
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
				(llmOutput.lang as LanguageKey) || fallbackLang
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
				await uploadRecipeImage(event.locals.supabase, file, userRecipeId, []);
			} catch (error) {
				console.warn('Failed to download & upload the image, skipping:', error);
			}
		}

		const cacheHit = !!cache && !!getLlmOutput(cache);
		const usage = await consumeCredits({
			amount: FEATURE_COSTS.import_recipe_from_website.seeds,
			feature: 'import_recipe_from_website' as PaidFeatureKey,
			metadata: JSON.stringify({
				recipe_url: url,
				cache_hit: cacheHit,
				cache_key: cacheKey,
				strategy: scrapeStats.strategy,
				format: scrapeStats.format,
				content_length: scrapeStats.content_length,
				attempts: scrapeStats.attempts.length
			})
		});

		// TODO Complete is true hoping the recipe is good, but should do a last zod check to dynamically route the user
		yield { id: userRecipeId, isComplete: true, usage };
	}
);

export const importRecipeFromText = query.live(
	z.object({
		spaceId: z.string(),
		text: z.string().min(10),
		fallbackLang: languageKeySchema
	}),
	async function* ({ spaceId, text, fallbackLang }) {
		console.log('Importing recipe from text', spaceId, text);
		const event = getRequestEvent();

		// Check authentication
		const { userId, isValid } = await serverIsUserAuthenticated(event.locals.supabase);
		if (!isValid) throw new Error('User must be confirmed with a valid email.');

		// Check credit balance
		const authorized = await canUserAfford(
			event.locals.supabase,
			userId,
			FEATURE_COSTS.import_recipe_from_text.seeds
		);
		if (!authorized) throw new Error('User cannot afford the feature.');

		// The draft recipe and its data are written through the admin client so that
		// consume_credits (only callable by service_role) can be used and the recipe
		// writes don't depend on client-side RLS.
		const admin = event.locals.supabaseAdmin;

		// Step 0: Warming up
		yield 0;
		const { data: languageData } = await getLanguageId(
			event.locals.supabase,
			fallbackLang as LanguageKey
		);
		if (!languageData) throw new Error('Could not retrieve language ID.');

		const recipeId = await createDraftRecipe({
			sourceType: 'user-manual',
			lang: languageData.lang,
			title: 'Creating recipe...'
		});
		if (!recipeId) {
			throw new Error('Failed to create draft recipe.');
		}

		// Step 1: Organizing your recipe
		yield 1;
		let enrichedRecipe: EnrichedRecipeOutput;
		try {
			const result = await enrichTextRecipe({ text });
			enrichedRecipe = result.output;
		} catch {
			throw new Error('LLM errored, cannot import text recipe without LLM');
		}

		// Step 2: Finding ingredients & units
		yield 2;
		const processedIngredients = await processAndMatchIngredients(
			admin,
			enrichedRecipe.ingredients,
			(enrichedRecipe.lang as LanguageKey) || languageData.lang || 'fr-FR'
		);
		console.log('Enriched recipe from LLM:', enrichedRecipe, processedIngredients);

		await saveEnrichedRecipe(admin, recipeId, enrichedRecipe);
		await insertRecipeIngredients(admin, recipeId, processedIngredients);

		const usage = await consumeCredits({
			amount: FEATURE_COSTS.import_recipe_from_text.seeds,
			feature: 'import_recipe_from_text' as PaidFeatureKey,
			metadata: JSON.stringify({
				length: text.length
			})
		});

		// Complete is false to make the user review the imported data
		yield { id: recipeId, isComplete: false, usage };
	}
);
