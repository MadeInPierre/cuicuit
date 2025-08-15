import { supabase } from '$lib/shared/db/supabase-client';

export async function getPlanMeals(spaceId: string) {
	if (!supabase) throw new Error('Supabase client not available');
	if (!spaceId) throw new Error('Space ID not provided');

	const { data, error } = await supabase
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

	return { data, error };
}

export type MealWithIngredients = NonNullable<
	Awaited<ReturnType<typeof getPlanMeals>>['data']
>[number];
