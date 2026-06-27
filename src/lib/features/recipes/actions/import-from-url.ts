import type { ActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
import { supabase } from '$lib/shared/db/supabase-client';
import type { PublicRecipesRow } from '$lib/shared/db/supazod.schemas';
import { capitalize } from '$lib/utils';
import type { Database } from 'lucide-svelte';
import { enrichParsedRecipe, enrichTextRecipe } from '../modules/enrich-recipe.remote';
import { matchIngredients } from '../modules/parse-ingredients/match';
import {
	processIngredientStrings,
	type IngredientProcessed
} from '../modules/parse-ingredients/process';
import { parseRecipeUrl, type RecipeParsed } from '../modules/parse-recipe-url.remote';
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

	const parsedRecipe = (await parseRecipeUrl({ url })) as RecipeParsed;
	console.log('Fetched recipe object:', parsedRecipe);

	if (!parsedRecipe.title || !parsedRecipe.instructions || parsedRecipe.instructions.length === 0) {
		throw new Error('Failed to extract recipe parsedRecipe from the provided URL.');
	}

	const recipeId = await createDraftRecipe('website', space.language.id);

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
	const { data: insertData, error: insertError } = await supabase
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
			language_id: space.language.id,
			updated_at: new Date().toISOString(),
			steps: parsedRecipe.instructions
			// Ingredients will be handled separately
		} satisfies Partial<PublicRecipesRow>)
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
		const enrichedRecipe = await enrichParsedRecipe({
			recipe: insertData,
			ingredients: parsedRecipe.ingredients.flatMap((group) => group.ingredients) // TODO support ingredient groups
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

		// Abort if update failed to trigger local processing fallback
		if (enrichedInsertError || !enrichedInsertData) {
			console.error('Error inserting enriched recipe data:', enrichedInsertError);
			throw new Error('Failed to insert enriched recipe data.');
		}
	} catch (error) {
		console.warn('Failed to enrich imported recipe data, proceeding with raw data:', error);

		// Fallback to locally processing the ingredients
		processedIngredients = await processIngredientStrings(
			parsedRecipe.ingredients.flatMap((group) => group.ingredients), // TODO support groups
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

export async function importRecipeFromText(
	space: ActiveSpaceState,
	text: string
): Promise<{ id: string; isComplete: boolean }> {
	if (!space.language?.id) {
		throw new Error('Active space does not have a language set.');
	}
	console.log('Importing text:', text);

	const recipeId = await createDraftRecipe('website', space.language.id);

	if (!recipeId) {
		throw new Error('Failed to create draft recipe.');
	}

	// This will hold the processed ingredients (locally or via LLM), and will then be inserted into the database
	let processedIngredients: IngredientProcessed[] = [];

	// Try to call an LLM to enhance & complete the data before inserting
	try {
		// Call the LLM remote function
		const enrichedRecipe = await enrichTextRecipe({
			text
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

		// Abort if update failed to trigger local processing fallback
		if (enrichedInsertError || !enrichedInsertData) {
			console.error('Error inserting enriched recipe data:', enrichedInsertError);
			throw new Error('Failed to insert enriched recipe data.');
		}
	} catch (error) {
		throw new Error('Cannot import text recipe without LLM');
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
