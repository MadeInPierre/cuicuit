import { type ActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
import { supabase } from '$lib/shared/db/supabase-client';
import type { TablesInsert } from '$lib/shared/db/supabase.types';

export async function addRecipeToActivePlan(
	space: ActiveSpaceState,
	recipeId: string,
	servings: number
) {
	if (!space?.activeSpace || !space.activePlanMeals || !space.activeMember?.user_id) {
		console.error('No active space or active plan found');
		return;
	}
	if (!supabase) {
		console.error('No Supabase client found');
		return;
	}

	const activeSpaceId = space.activeSpace.id;

	// Add the recipe to the active plan in Supabase and get the generated meal id
	const { data, error } = await supabase
		.from('space_meals')
		.insert({
			space_id: activeSpaceId,
			created_by: space.activeMember.user_id,
			recipe_id: recipeId,
			servings: servings,
			position: space.activePlanMeals.length // Append to the end of the plan
		})
		.select('id')
		.single();

	if (error) {
		console.error('Error adding recipe to active plan:', error);
		return;
	}

	const mealId = data?.id;

	// Add the recipe's ingredients to the active plan's shopping list
	const { data: recipeIngredients, error: ingredientsError } = await supabase
		.from('recipe_ingredients')
		.select('*')
		.eq('recipe_id', recipeId);

	if (ingredientsError) {
		console.error('Error fetching recipe ingredients:', ingredientsError);
		return;
	}

	const shoppingListItems = recipeIngredients.map(
		(ingredient) =>
			({
				space_id: activeSpaceId,
				created_by: space.activeMember!.user_id,
				type: 'meal',
				meal_id: mealId,
				meal_origin: 'recipe',
				ingredient_id: ingredient.ingredient_id,
				priority: ingredient.is_optional ? 'optional' : 'required',
				name: ingredient.raw_input,
				quantity: ingredient.quantity ?? 1,
				unit: ingredient.unit
			}) satisfies TablesInsert<'space_items'>
	);

	const { error: shoppingListError } = await supabase.from('space_items').insert(shoppingListItems);

	if (shoppingListError) {
		console.error('Error adding ingredients to shopping list:', shoppingListError);
		return;
	}

	// Refresh the active plan meals after adding
	await space.refreshActivePlanMeals();
}
