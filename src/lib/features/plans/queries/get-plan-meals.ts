import { supabase } from '$lib/shared/db/supabase-client';

export function getPlanMeals(spaceId: string, languageId: number) {
	if (!supabase) throw new Error('Supabase client not available');
	if (!spaceId) throw new Error('Space ID not provided');

	return (
		supabase
			.from('space_meals')
			.select(
				`*, 
			recipe:recipes(
				*,
				language:languages(*)
			),
			shopping_ingredients:space_items(
				*,
				ingredient:ingredients(
					*,
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
