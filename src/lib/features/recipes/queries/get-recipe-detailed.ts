import { supabase } from '$lib/shared/db/supabase-client.svelte';

/**
 * Fetches detailed information about recipes, including their language, ingredients,
 * courses, cuisines, times of day, tags, and tools.
 *
 * @returns A promise that resolves to the recipe data with detailed information.
 */
export function getRecipesDetailed(languageId: number, searchText?: string) {
	if (!supabase.client) throw new Error("No supabase client");

	// substitutes:ingredient_substitutions!ingredient_substitutions_original_ingredient_id_fkey(
	// 	*,
	// 	original_ingredient:ingredients!ingredient_substitutions_original_ingredient_id_fkey(*,
	// 		translations:ingredient_translations(*, language:languages!inner(*))
	// 	),
	// 	substitute_ingredient:ingredients!ingredient_substitutions_substitute_ingredient_id_fkey(*,
	// 		translations:ingredient_translations(*, language:languages!inner(*))
	// 	)
	// )
	let query = supabase.client
		.from('recipes_randomized')
		.select(
			`*,
			language:languages(*),
			ingredients:recipe_ingredients(
				*,
				ingredient:ingredients(
					id, slug, slug_general, aisle, hierarchy, base_unit, unit_frequencies, g_per_unit, g_per_ml,
					translations:ingredient_translations(*, language:languages!inner(lang))
				)
			)`
		)
		.eq('ingredients.ingredient.translations.language_id', languageId) // Only get translations in the user language
		.is('deleted_at', null);
	// .eq('author_id', userState.user?.id || ''); // TODO per-user recipe visibility

	if (searchText) {
		// Remove accents from searchText for accent-insensitive search
		const normalizedSearchText = searchText
			.trim()
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '');
		query = query.ilike('search_term', `%${normalizedSearchText}%`);
	}

	return query;
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
export async function getRecipeDetailed(recipeId: string, languageId: number) {
	if (!supabase.client) throw new Error("No supabase client");
	if (!recipeId) throw new Error('Recipe ID not provided');

	// Get the recipe
	const { data, error } = await getRecipesDetailed(languageId).eq('id', recipeId).single();
	if (error || !data) {
		console.error('Error fetching recipes:', error);
		return { data: null, error };
	}

	// Add the author's public profile
	const { data: authorProfile, error: profileError } = await supabase.client
		.from('user_public_profiles')
		.select('*')
		.eq('user_id', data.author_id!)
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
export type Recipe = Omit<RecipeDetailed, 'ingredients'>;

export type RecipeIngredientDetailed = NonNullable<
	Awaited<ReturnType<typeof getRecipeDetailed>>['data']
>['ingredients'][number];

// Basic ingredient without substitutes, used in simpler contexts
export type RecipeIngredientWithTranslations = Omit<
	NonNullable<
		Awaited<ReturnType<typeof getRecipeDetailed>>['data']
	>['ingredients'][number]['ingredient'],
	'substitutes'
> & {
	translations: NonNullable<
		Awaited<ReturnType<typeof getRecipeDetailed>>['data']
	>['ingredients'][number]['ingredient']['translations'];
};

export type RecipeDetailedWithAuthor = NonNullable<
	Awaited<ReturnType<typeof getRecipeDetailed>>['data']
>;
