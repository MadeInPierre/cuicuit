import { getRequestEvent, query } from '$app/server';
import { canUserAfford } from '$lib/features/auth/queries/get-user-credit-balance';
import { FEATURE_COSTS, type PaidFeatureKey } from '$lib/features/billing/consts';
import { consumeCredits } from '$lib/features/billing/server/consume-credits.remote';
import { serverIsUserAuthenticated } from '$lib/features/billing/server/utils/is-user-authenticated';
import { languageKeySchema, languages, type LanguageKey } from '$lib/features/user-settings/consts';
import type { Database } from '$lib/shared/db/supabase.types';
import type { PublicRecipesRow } from '$lib/shared/db/supazod.schemas';
import type { SupabaseClient } from '@supabase/supabase-js';
import z from 'zod';
import {
	enrichRawRecipe,
	enrichTextRecipe,
	type EnrichedRecipeOutput
} from '../modules/enrich-recipe.remote';
import { matchIngredients } from '../modules/parse-ingredients/match';
import type { ParsedSearchInput } from '../modules/parse-ingredients/parse';
import type { IngredientProcessed } from '../modules/parse-ingredients/process';
import { scrapeRecipeUrl } from '../modules/scrape-recipe/orchestrator.remote';
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

	const { data: enrichedInsertData, error: enrichedInsertError } = await supabase
		.from('recipes')
		.update({
			language_id: langId,
			title: enrichedRecipe.recipe.title,
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
					unit: processed.parsed.quantity?.unitKey || 'whole',
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

// ==========================================
// Main Exported Functions
// ==========================================

export const importRecipeFromUrl = query(
	z.object({
		spaceId: z.string(),
		url: z.url(),
		fallbackLang: languageKeySchema
	}),
	async ({ spaceId, url, fallbackLang }) => {
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

		// 1. Scrape with the multi-strategy pipeline (cheapest to most expensive).
		const scraped = await scrapeRecipeUrl({ url });
		console.log('Scraped recipe:', scraped.strategy, scraped.format, scraped.attempts);

		// 2. Use the space's language as fallback if the LLM doesn't guess it from the recipe.
		const { data: languageData } = await getLanguageId(
			event.locals.supabase,
			fallbackLang as LanguageKey
		);
		if (!languageData) throw new Error('Could not retrieve language ID.');

		// 3. Create the draft recipe.
		const recipeId = await createDraftRecipe({
			sourceType: 'website',
			lang: languageData.lang,
			title: 'Creating recipe...'
		});
		if (!recipeId) {
			throw new Error('Failed to create draft recipe.');
		}

		// 4. Attach source attribution to the draft (best-effort, so the draft is
		// traceable even if the LLM parse fails later).
		await event.locals.supabase
			.from('recipes')
			.update({
				source_url: scraped.source?.url || url,
				updated_at: new Date().toISOString()
			})
			.eq('id', recipeId);

		// 5. Download & store the best-guess image (best-effort).
		if (scraped.image) {
			try {
				const imgResponse = await fetch(scraped.image);
				const blob = await imgResponse.blob();
				const file = new File([blob], 'imported-image.jpg', { type: blob.type });
				await uploadRecipeImage(event.locals.supabase, file, recipeId, []);
			} catch (error) {
				console.warn('Failed to download & upload the image, skipping:', error);
			}
		}

		// 6. Let the LLM parse the raw scraped content into the app schema.
		let enrichedRecipe: EnrichedRecipeOutput;
		try {
			enrichedRecipe = await enrichRawRecipe({
				content: scraped.content,
				format: scraped.format,
			});
		} catch (error) {
			console.error('Failed to parse scraped recipe with the LLM:', error);
			throw new Error(
				'Failed to parse the scraped recipe with the LLM. The draft was saved — please try again.'
			);
		}

		// 7. Persist the enriched recipe.
		await saveEnrichedRecipe(event.locals.supabase, recipeId, enrichedRecipe);
		console.log('Enriched recipe from LLM:', enrichedRecipe);

		// 8. Match & insert the enriched ingredients.
		const processedIngredients = await processAndMatchIngredients(
			event.locals.supabase,
			enrichedRecipe.ingredients,
			(enrichedRecipe.lang as LanguageKey) || languageData.lang || 'fr-FR'
		);
		await insertRecipeIngredients(event.locals.supabase, recipeId, processedIngredients);

		// 9. Charge the feature, recording scrape stats in the billing metadata.
		const usage = await consumeCredits({
			amount: FEATURE_COSTS.import_recipe_from_website.seeds,
			feature: 'import_recipe_from_website' as PaidFeatureKey,
			metadata: JSON.stringify({
				recipe_url: url,
				strategy: scraped.strategy,
				format: scraped.format,
				content_length: scraped.content.length,
				attempts: scraped.attempts.length
			})
		});

		// TODO Complete is false to make the user review the imported data for now
		return { id: recipeId, isComplete: false, usage };
	}
);

export const importRecipeFromText = query(
	z.object({
		spaceId: z.string(),
		text: z.string().min(10),
		fallbackLang: languageKeySchema
	}),
	async ({ spaceId, text, fallbackLang }) => {
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

		// Use the space's language as fallback if the LLM doesn't guess it from the recipe later
		const { data: languageData } = await getLanguageId(event.locals.supabase, fallbackLang as LanguageKey);
		if (!languageData) throw new Error('Could not retrieve language ID.');

		const recipeId = await createDraftRecipe({
			sourceType: 'website',
			lang: languageData.lang,
			title: 'Creating recipe...'
		});
		if (!recipeId) {
			throw new Error('Failed to create draft recipe.');
		}

		let processedIngredients: IngredientProcessed[] = [];

		// Try to call an LLM to enhance & complete the data before inserting
		try {
			const enrichedRecipe = await enrichTextRecipe({ text });

			processedIngredients = await processAndMatchIngredients(
				event.locals.supabase,
				enrichedRecipe.ingredients,
				(enrichedRecipe.lang as LanguageKey) || languageData.lang || 'fr-FR'
			);
			console.log('Enriched recipe from LLM:', enrichedRecipe, processedIngredients);

			await saveEnrichedRecipe(event.locals.supabase, recipeId, enrichedRecipe);
		} catch {
			throw new Error('LLM errored, cannot import text recipe without LLM');
		}

		await insertRecipeIngredients(event.locals.supabase, recipeId, processedIngredients);

		const usage = await consumeCredits({
			amount: FEATURE_COSTS.import_recipe_from_text.seeds,
			feature: 'import_recipe_from_text' as PaidFeatureKey,
			metadata: JSON.stringify({
				length: text.length
			})
		});

		// TODO Complete is false to make the user review the imported data for now
		return { id: recipeId, isComplete: false, usage };
	}
);
