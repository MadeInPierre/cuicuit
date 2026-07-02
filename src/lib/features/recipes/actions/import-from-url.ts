import type { ActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
import { languages, type LanguageKey } from '$lib/features/user-settings/consts';
import { supabase } from '$lib/shared/db/supabase-client.svelte';
import type { PublicRecipesRow } from '$lib/shared/db/supazod.schemas';
import { capitalize } from '$lib/utils';
import type { Database } from 'lucide-svelte';
import {
	enrichParsedRecipe,
	enrichTextRecipe,
	type EnrichedRecipeOutput
} from '../modules/enrich-recipe.remote';
import { matchIngredients } from '../modules/parse-ingredients/match';
import type { ParsedSearchInput } from '../modules/parse-ingredients/parse';
import {
	processIngredientStrings,
	type IngredientProcessed
} from '../modules/parse-ingredients/process';
import { parseRecipeUrl, type RecipeParsed } from '../modules/parse-recipe-url.remote';
import { createDraftRecipe } from './create-draft-recipe';
import { uploadRecipeImage } from './upload-recipe-image';

// ==========================================
// Reusable Helper Functions
// ==========================================

/**
 * Validates that the active space has a language configured.
 */
function validateLanguage(space: ActiveSpaceState) {
	if (!space.language?.id) {
		throw new Error('Active space does not have a language set.');
	}
	return space.language;
}

/**
 * Enriches and matches a raw list of ingredients against the database matches.
 */
async function processAndMatchIngredients(
	enrichedIngredients: ParsedSearchInput[],
	lang: LanguageKey
): Promise<IngredientProcessed[]> {
	const { data: matchData, error: matchError } = await matchIngredients(
		enrichedIngredients
			.filter((p) => p.ingredientText && p.ingredientText.trim().length > 0)
			.map((p) => p.ingredientText || 'Unknown'),
		lang
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
	recipeId: string,
	enrichedRecipe: EnrichedRecipeOutput
): Promise<void> {
	if (!supabase.client) throw new Error('No supabase client');

	// Get the recipe's language database ID
	const langId =
		Object.entries(languages).find(([key, _]) => key === enrichedRecipe.lang)?.[1].id || 1;

	const { data: enrichedInsertData, error: enrichedInsertError } = await supabase.client
		.from('recipes')
		.update({
			language_id: langId,
			title: enrichedRecipe.recipe.title,
			short_title: enrichedRecipe.recipe.shortTitle,
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
	recipeId: string,
	processedIngredients: IngredientProcessed[]
): Promise<void> {
	if (!supabase.client) throw new Error('No supabase client');

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

		const { data: ingredientInsertData, error: ingredientInsertError } = await supabase.client
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

/**
 * Imports a recipe from a URL and creates a new recipe
 * document with as much data as possible already filled in.
 */
export async function importRecipeFromUrl(
	space: ActiveSpaceState,
	url: string,
	userId: string
): Promise<{ id: string; isComplete: boolean }> {
	if(!supabase.client) throw new Error("No supabase client");
	
	const language = validateLanguage(space);
	console.log('Importing URL:', url);

	const parsedRecipe = (await parseRecipeUrl({ url })) as RecipeParsed;
	console.log('Fetched recipe object:', parsedRecipe);

	if (!parsedRecipe.title || !parsedRecipe.instructions || parsedRecipe.instructions.length === 0) {
		throw new Error('Failed to extract recipe parsedRecipe from the provided URL.');
	}

	const recipeId = await createDraftRecipe('website', language.id);
	if (!recipeId) {
		throw new Error('Failed to create draft recipe.');
	}

	// Download & store the image to Supabase, and get the image ID
	try {
		const imgResponse = await fetch(parsedRecipe.image);
		const blob = await imgResponse.blob();
		const file = new File([blob], 'imported-image.jpg', { type: blob.type });
		await uploadRecipeImage(file, recipeId, []);
	} catch (error) {
		console.warn('Failed to download & upload the image, skipping:', error);
	}

	// Insert the imported data into the database
	const { data: insertData, error: insertError } = await supabase.client
		.from('recipes')
		.update({
			author_id: userId,
			source_type: 'website',
			source_url: parsedRecipe.source.url,
			title: capitalize(parsedRecipe.title?.trim()),
			short_title: capitalize(parsedRecipe.title?.trim())?.split(' ')?.[0] || '?',
			description: capitalize(parsedRecipe.description?.trim() || ''),
			time_prep_minutes: parseInt(parsedRecipe.time.prep) || null,
			time_cook_minutes: parseInt(parsedRecipe.time.cook) || null,
			time_rest_minutes: parseInt(parsedRecipe.time.rest) || null,
			servings: parseInt(parsedRecipe.servings) || 4,
			language_id: language.id,
			updated_at: new Date().toISOString(),
			steps: parsedRecipe.instructions
		} satisfies Partial<PublicRecipesRow>)
		.eq('id', recipeId)
		.select()
		.single();

	if (insertError || !insertData) {
		console.error('Error inserting imported recipe data:', insertError);
		throw new Error('Failed to insert imported recipe data.');
	}

	let processedIngredients: IngredientProcessed[] = [];

	// Try to call an LLM to enhance & complete the data before inserting
	try {
		const enrichedRecipe = await enrichParsedRecipe({
			recipe: insertData,
			ingredients: parsedRecipe.ingredients.flatMap((group) => group.ingredients) // TODO support ingredient groups
		});

		processedIngredients = await processAndMatchIngredients(
			enrichedRecipe.ingredients,
			enrichedRecipe.lang as LanguageKey
		);
		console.log('Enriched recipe from LLM:', enrichedRecipe, processedIngredients);

		await saveEnrichedRecipe(recipeId, enrichedRecipe);
	} catch (error) {
		console.warn('Failed to enrich imported recipe data, proceeding with raw data:', error);

		// Fallback to locally processing the ingredients
		processedIngredients = await processIngredientStrings(
			parsedRecipe.ingredients.flatMap((group) => group.ingredients), // TODO support groups
			language.lang // Assuming the space's main language as fallback
		);
	}

	await insertRecipeIngredients(recipeId, processedIngredients);

	// TODO Complete is false to make the user review the imported data for now
	return { id: recipeId, isComplete: false };
}

/**
 * Imports a recipe from a raw text payload utilizing an LLM engine.
 */
export async function importRecipeFromText(
	space: ActiveSpaceState,
	text: string
): Promise<{ id: string; isComplete: boolean }> {
	const language = validateLanguage(space);
	console.log('Importing text:', text);

	const recipeId = await createDraftRecipe('website', language.id);
	if (!recipeId) {
		throw new Error('Failed to create draft recipe.');
	}

	let processedIngredients: IngredientProcessed[] = [];

	// Try to call an LLM to enhance & complete the data before inserting
	try {
		const enrichedRecipe = await enrichTextRecipe({ text });

		processedIngredients = await processAndMatchIngredients(
			enrichedRecipe.ingredients,
			enrichedRecipe.lang as LanguageKey
		);
		console.log('Enriched recipe from LLM:', enrichedRecipe, processedIngredients);

		await saveEnrichedRecipe(recipeId, enrichedRecipe);
	} catch (error) {
		throw new Error('LLM errored, cannot import text recipe without LLM');
	}

	await insertRecipeIngredients(recipeId, processedIngredients);

	// TODO Complete is false to make the user review the imported data for now
	return { id: recipeId, isComplete: false };
}
