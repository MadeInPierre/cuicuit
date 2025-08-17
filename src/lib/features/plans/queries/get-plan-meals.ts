import { supabase } from '$lib/shared/db/supabase-client';

export function getPlanMeals(spaceId: string) {
	if (!supabase) throw new Error('Supabase client not available');
	if (!spaceId) throw new Error('Space ID not provided');

	return supabase
		.from('space_plan_meals')
		.select(
			`*,
			ingredients:space_plan_shopping_lists(
				*,
				ingredient:ingredients(
					*,
					translations:ingredient_translations(*)
				)
			)`
		)
		.eq('space_id', spaceId);
}

export type MealWithIngredients = NonNullable<
	Awaited<ReturnType<typeof getPlanMeals>>['data']
>[number];
