import type { ActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
import { supabase } from '$lib/shared/db/supabase-client';
import type { PublicRecipesRow } from '$lib/shared/db/supazod.schemas';
import { capitalize } from '$lib/utils';
import type { Database } from 'lucide-svelte';
import type { ScraperResponse } from '../../../../routes/api/recipes/import-from-url/+server';
import { enrichRecipe } from '../modules/enrich-recipe.remote';
import { matchIngredients } from '../modules/parse-ingredients/match';
import {
	processIngredientStrings,
	type IngredientProcessed
} from '../modules/parse-ingredients/process';
import { createDraftRecipe } from './create-draft-recipe';
import { uploadRecipeImage } from './upload-recipe-image';

/**
 * Imports a recipe from a URL and creates a new recipe
 * document with as much data as possible already filled in.
 * If the data is incomplete, the user will be prompted to
 * fill in the missing fields.
 *
 * @param url The URL to import the recipe from.
 * @param userDocState The user document state.
 * @returns An object containing the ID of the imported recipe
 * and a boolean indicating if the data is complete.
 */
export async function importRecipeFromUrl(
	space: ActiveSpaceState,
	url: string,
	userId: string
): Promise<{ id: string; isComplete: boolean }> {
	if (!space.language?.id) {
		throw new Error('Active space does not have a language set.');
	}
	console.log('Importing URL:', url);

	const response = await fetch('/api/recipes/import-from-url', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ url })
	});
	const data = (await response.json()) as ScraperResponse;
	console.log('Fetched recipe object:', data);

	if (!data.title || !data.instructions || data.instructions.length === 0) {
		throw new Error('Failed to extract recipe data from the provided URL.');
	}

	// New Supabase-based implementation
	const recipeId = await createDraftRecipe('website', space.language.id);

	if (!recipeId) {
		throw new Error('Failed to create draft recipe.');
	}

	// Download & store the image to Supabase, and get the image ID
	try {
		const imgResponse = await fetch(data.image);
		const blob = await imgResponse.blob();
		const file = new File([blob], 'imported-image.jpg', { type: blob.type });
		await uploadRecipeImage(file, recipeId, []);
	} catch (error) {
		console.warn('Failed to download & upload the image, skipping:', error);
	}

	// Using the raw parsed data, create a new recipe row
	let recipeRow: Partial<PublicRecipesRow> = {
		author_id: userId,
		source_type: 'website',
		source_url: data.source.url,
		title: capitalize(data.title?.trim()),
		description: capitalize(data.description?.trim() || ''),
		time_prep_minutes: parseInt(data.time.prep) || null,
		time_cook_minutes: parseInt(data.time.cook) || null,
		time_rest_minutes: parseInt(data.time.rest) || null,
		servings: parseInt(data.servings) || 4,
		language_id: space.language.id,
		updated_at: new Date().toISOString(),
		steps: data.instructions
		// Ingredients will be handled separately
	};

	// Insert the imported data into the database
	const { data: insertData, error: insertError } = await supabase
		.from('recipes')
		.update(recipeRow)
		.eq('id', recipeId)
		.select()
		.single();

	if (insertError || !insertData) {
		console.error('Error inserting imported recipe data:', insertError);
		throw new Error('Failed to insert imported recipe data.');
	}

	// This will hold the processed ingredients (locally or via LLM), and will then be inserted into the database
	let processedIngredients: IngredientProcessed[] = [];

	// Try to call an LLM to enhance & complete the data before inserting
	try {
		// Call the LLM remote function
		const enrichedRecipe = await enrichRecipe({
			recipe: insertData,
			ingredients: data.ingredients.flatMap((group) => group.ingredients)
		});

		// Use the enriched ingredients to match against the ingredient database
		const { data: matchData, error: matchError } = await matchIngredients(
			enrichedRecipe.ingredients
				.filter((p) => p.ingredientText && p.ingredientText.trim().length > 0)
				.map((p) => p.ingredientText || 'Unknown'),
			space.language.lang
		);

		// Abort if matching failed
		if (matchError) throw matchError;

		// Save the better matched & enriched ingredients
		processedIngredients = enrichedRecipe.ingredients.map(
			(p, i) =>
				({
					sourceText: p.sourceText || 'Unknown',
					parsed: p,
					matches: matchData?.matches[i].bestMatches || []
				}) satisfies IngredientProcessed
		);
		console.log('Enriched recipe from LLM:', enrichedRecipe, processedIngredients);

		// Update the recipe with the enriched LLM data
		const { data: enrichedInsertData, error: enrichedInsertError } = await supabase
			.from('recipes')
			.update({
				// Don't overwrite database IDs and automatic fields, only the user-editable fields
				title: enrichedRecipe.recipe.title,
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

		// Abort if update failed to trigger local processing fallback
		if (enrichedInsertError || !enrichedInsertData) {
			console.error('Error inserting enriched recipe data:', enrichedInsertError);
			throw new Error('Failed to insert enriched recipe data.');
		}
	} catch (error) {
		console.warn('Failed to enrich imported recipe data, proceeding with raw data:', error);

		// Fallback to locally processing the ingredients
		processedIngredients = await processIngredientStrings(
			data.ingredients.flatMap((group) => group.ingredients), // TODO support groups
			space.language.lang
		);
	}

	// Insert the ingredients
	if (!processedIngredients || processedIngredients.length === 0) {
		console.warn('No ingredients matched during import.');
	} else {
		console.log('Matched ingredients for import:', processedIngredients);

		for (const processed of processedIngredients) {
			// Insert the ingredient into recipe_ingredients
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
						// group_name: '', // TODO support groups
						// display_order: 0, // TODO determine order
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

	// TODO Complete is false to make the user review the imported data for now
	return { id: recipeId, isComplete: false };
}
