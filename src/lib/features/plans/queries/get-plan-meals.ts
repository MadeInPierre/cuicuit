import { supabase } from '$lib/shared/db/supabase-client';

export function getPlanMeals(spaceId: string, lang: string = 'fr-FR') {
	if (!supabase) throw new Error('Supabase client not available');
	if (!spaceId) throw new Error('Space ID not provided');

	return (
		supabase
			.from('space_plan_meals')
			.select(
				`*, 
			recipe:recipes(
				*,
				language:languages(*)
			),
			shopping_ingredients:space_plan_shopping_lists(
				*,
				ingredient:ingredients(
					*,
					translations:ingredient_translations(
						*,
						language:languages(*)
					)
				)
			)`
			)
			.eq('space_id', spaceId)
			// Only get translations in the user language
			.eq('shopping_ingredients.ingredient.translations.language.lang', lang)
	);
}

export type MealWithRecipeAndIngredients = NonNullable<
	Awaited<ReturnType<typeof getPlanMeals>>['data']
>[number];
export type ShoppingIngredient = NonNullable<
	Awaited<ReturnType<typeof getPlanMeals>>['data']
>[number]['shopping_ingredients'][number];
