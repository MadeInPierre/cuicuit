import { uploadRecipeImage } from './upload-recipe-image';
import { createDraftRecipe } from './create-draft-recipe';
import { capitalize } from '$lib/utils';
import { supabase } from '$lib/shared/db/supabase-client';
import type { Database } from '$lib/shared/db/supabase.types';
import { getLanguageId } from '../queries/get-language-id';
import { processIngredientStrings } from '../modules/parse-ingredients/process';
const SCRAPER_API_URL = 'http://localhost:8000/scrape-recipe';

// See the scraper source code for the expected response format,
// don't forget to update this type if the scraper response changes.
type ScraperResponse = {
	source: {
		name: string;
		domain: string;
		url: string;
	};
	title: string;
	description: string;
	image: string;
	author: string;
	servings: string;
	ingredients: [{ ingredients: string[]; purpose: string }]; // TODO slice quantities
	instructions: string[];
	time: {
		prep: string;
		cook: string;
		rest: string;
		total: string;
	};
	ratings: string;
	category: string;
	language: string;
};

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
export async function importFromUrl(
	url: string,
	userId: string
): Promise<{ id: string; isComplete: boolean }> {
	console.log('Importing URL:', url);

	const response = await fetch(SCRAPER_API_URL, {
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

	const { data: languageIdData, error: languageIdError } = await getLanguageId(data.language);
	if (languageIdError || !languageIdData?.id) {
		throw new Error('Unsupported language for imported recipe.');
	}
	console.log('Detected language ID:', languageIdData.id);

	// New Supabase-based implementation
	const recipeId = await createDraftRecipe('website', languageIdData.lang);

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

	// Insert the imported data into the new recipe row
	const { data: insertData, error: insertError } = await supabase
		.from('recipes')
		.update({
			author_id: userId,
			source_type: 'website',
			source_url: data.source.url,
			title: capitalize(data.title),
			description: capitalize(data.description || ''),
			time_prep_minutes: parseInt(data.time.prep) || null,
			time_cook_minutes: parseInt(data.time.cook) || null,
			time_rest_minutes: parseInt(data.time.rest) || null,
			servings: parseInt(data.servings) || 4,
			language_id: languageIdData?.id || 0,
			updated_at: new Date().toISOString(),
			steps: data.instructions
			// Ingredients will be handled separately
		} satisfies Database['public']['Tables']['recipes']['Update'])
		.eq('id', recipeId)
		.select()
		.single();

	if (insertError || !insertData) {
		console.error('Error inserting imported recipe data:', insertError);
		throw new Error('Failed to insert imported recipe data.');
	}

	// Insert ingredients
	const processedIngredients = await processIngredientStrings(
		data.ingredients.flatMap((group) => group.ingredients),
		languageIdData.lang
	);

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
						ingredient_id: bestMatch.ingredient_id,
						quantity: processed.parsed.quantity?.amount || 1,
						unit: processed.parsed.quantity?.unitKey || 'whole',
						details: processed.parsed.description || '',
						notes: ''
					} as Database['public']['Tables']['recipe_ingredients']['Insert']
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

	// TODO call an LLM to enhance & complete the data (e.g. automatic nutrition facts, missing fields, etc.)

	// TODO Complete is false to make the user review the imported data for now, will implement LLM auto-completion later
	return { id: recipeId, isComplete: false };
}
