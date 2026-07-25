import { supabase } from '$lib/shared/db/supabase-client.svelte';

export function getPlanMeals(spaceId: string, languageId: number) {
	if (!supabase.client) throw new Error('Supabase client not available');
	if (!spaceId) throw new Error('Space ID not provided');

	return (
		supabase.client
			.from('space_meals')
			.select(
				`*, 
				recipe:recipes(
					*,
					language:languages(*),
					recipe_ingredients(*)
				),
				shopping_ingredients:space_items(
					*,
					author_profile:user_public_profiles(*),
					ingredient:ingredients(
						id, slug, slug_general, aisle, hierarchy, base_unit, unit_frequencies, g_per_unit, g_per_ml,
						translations:ingredient_translations(
							*,
							language:languages(lang)
						)
					)
				)`
			)
			.eq('space_id', spaceId)
			// Only get translations in the user language
			.eq('shopping_ingredients.ingredient.translations.language_id', languageId)
	);
}

export type MealWithRecipeAndIngredients = NonNullable<
	Awaited<ReturnType<typeof getPlanMeals>>['data']
>[number];
export type ShoppingIngredient = NonNullable<
	Awaited<ReturnType<typeof getPlanMeals>>['data']
>[number]['shopping_ingredients'][number];

export function formatIngredientDisplayName(si: ShoppingIngredient) {
	const t = si.ingredient?.translations?.[0];
	return si.quantity && si.quantity > 1
		? t?.name_plural || t?.name_singular || si.name
		: t?.name_singular || t?.name_plural || si.name;
}
