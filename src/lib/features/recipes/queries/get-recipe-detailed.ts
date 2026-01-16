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
		ingredients:recipe_ingredients(
			*,
			ingredient:ingredients(
				*,
				translations:ingredient_translations(
					*,
					language:languages(*)
				),
				substitutes:ingredient_substitutions!ingredient_substitutions_original_ingredient_id_fkey(
					*,
					original_ingredient:ingredients!ingredient_substitutions_original_ingredient_id_fkey(*,
						translations:ingredient_translations(*)
					),
					substitute_ingredient:ingredients!ingredient_substitutions_substitute_ingredient_id_fkey(*,
						translations:ingredient_translations(*)
					)
				)
			)
		)`
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
export async function getRecipeDetailed(recipeId: string) {
	if (!supabase) throw new Error('Supabase client not available');
	if (!recipeId) throw new Error('Recipe ID not provided');

	// Get the recipe
	const { data, error } = await getRecipesDetailed().eq('id', recipeId).single();
	if (error || !data) {
		console.error('Error fetching recipes:', error);
		return { data: null, error };
	}

	// Add the author's public profile
	const { data: authorProfile, error: profileError } = await supabase
		.from('user_public_profiles')
		.select('*')
		.eq('user_id', data.author_id)
		.single();

	if (profileError || !authorProfile) {
		console.error('Error fetching author profile:', profileError);
		return { data: null, error: profileError };
	}

	const recipe = {
		...data,
		author: authorProfile
	};

	return { data: recipe, error: null };
}

export type RecipeDetailed = NonNullable<
	Awaited<ReturnType<typeof getRecipesDetailed>>['data']
>[number];
export type RecipeIngredientWithTranslations = NonNullable<
	Awaited<ReturnType<typeof getRecipeDetailed>>['data']
>['ingredients'][number];
export type IngredientWithTranslations = NonNullable<
	Awaited<ReturnType<typeof getRecipeDetailed>>['data']
>['ingredients'][number]['ingredient'];
export type RecipeDetailedWithAuthor = NonNullable<
	Awaited<ReturnType<typeof getRecipeDetailed>>['data']
>;
export type RecipeIngredient = NonNullable<
	Awaited<ReturnType<typeof getRecipeDetailed>>['data']
>['ingredients'][number];
