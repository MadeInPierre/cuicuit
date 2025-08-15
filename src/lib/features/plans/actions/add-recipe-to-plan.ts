import { type ActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
import { supabase } from '$lib/shared/db/supabase-client';

export async function addRecipeToActivePlan(
	activeSpace: ActiveSpaceState,
	recipeId: string,
	servings: number
) {
	if (!activeSpace?.activeSpace || !activeSpace.activePlan) {
		console.error('No active space or active plan found');
		return;
	}
	if (!supabase) {
		console.error('No Supabase client found');
		return;
	}

	const activeSpaceId = activeSpace.activeSpace.id;

	// Add the recipe to the active plan in Supabase and get the generated meal id
	const { data, error } = await supabase
		.from('space_plan_meals')
		.insert({
			space_id: activeSpaceId,
			recipe_id: recipeId,
			servings: servings,
			position: activeSpace.activePlan.length // Append to the end of the plan
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

	const shoppingListItems = recipeIngredients.map((ingredient) => ({
		space_id: activeSpaceId,
		type: 'meal',
		meal_id: mealId,
		meal_origin: 'recipe',
		ingredient_id: ingredient.ingredient_id,
		name: ingredient.raw_input,
		quantity: (ingredient.quantity ?? 1) * servings,
		unit: ingredient.unit
	}));

	const { error: shoppingListError } = await supabase
		.from('space_plan_shopping_lists')
		.insert(shoppingListItems);

	if (shoppingListError) {
		console.error('Error adding ingredients to shopping list:', shoppingListError);
		return;
	}

	// Refresh the active plan meals after adding
	await activeSpace.refreshActivePlan();
}
