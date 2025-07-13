import { supabase } from '$lib/shared/db/supabase-client';

/**
 * Fetches detailed information about recipes, including their language, ingredients,
 * courses, cuisines, times of day, tags, and tools.
 *
 * @returns A promise that resolves to the recipe data with detailed information.
 */
export function getRecipesDetailed() {
	return supabase.from('recipes').select(
		`*, 
            language:languages(*), 
            ingredients:recipe_ingredients(*), 
            courses:recipe_courses(*), 
            cuisines:recipe_cuisines(*), 
            times_of_day:recipe_times_of_day(*), 
            tags:recipe_tags(*), 
            tools:recipe_tools(*)`
	);
}

/**
 * Fetches detailed information about a recipe by its ID.
 * This function retrieves the recipe's language, ingredients,
 * courses, cuisines, times of day, tags, and tools.
 *
 * @param recipeId - The ID of the recipe to fetch.
 * @returns A promise that resolves to the detailed recipe data.
 * @throws Will throw an error if the recipe ID is not provided or if the query fails.
 */
export function getRecipeDetailed(recipeId: string) {
	return getRecipesDetailed().eq('id', recipeId).single();
}

export type RecipeDetailed = ReturnType<typeof getRecipeDetailed>;
