import type { ActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
import { supabase } from '$lib/shared/db/supabase-client';
import { toast } from 'svelte-sonner';
import type { MealWithRecipeAndIngredients } from '../queries/get-plan-meals';

export async function updateMealServings(
	activeSpace: ActiveSpaceState,
	meal: MealWithRecipeAndIngredients,
	servings: number,
	options?: { skipRefresh?: boolean }
) {
	if (!supabase) throw new Error('Supabase client not available');
	if (!activeSpace || !activeSpace.activeSpace || !activeSpace.activePlanMeals)
		throw new Error('No active space or active plan found');
	if (servings < 1) throw new Error('Servings must be at least 1');

	// Update the meal servings in Supabase
	const { error } = await supabase.from('space_meals').update({ servings }).eq('id', meal.id);
	if (error) throw new Error('Error updating meal servings: ' + error.message);

	// Update every shopping list item related to this meal to reflect the new amounts
	for (const ing of meal.recipe.recipe_ingredients) {
		const newAmount = ((ing.quantity ?? 1) * servings) / meal.recipe.servings;

		const { error: itemError } = await supabase
			.from('space_items')
			.update({ quantity: newAmount })
			.eq('space_id', activeSpace.activeSpace.id)
			.eq('meal_id', meal.id)
			.eq('ingredient_id', ing.ingredient_id);

		// Continue updating other items even if one fails
		if (itemError) {
			console.error(
				`Error updating shopping list item ${ing.ingredient_id} for meal ${meal.id}: ${itemError.message}`
			);
		}
	}

	// Refresh the active plan meals after updating
	if (options?.skipRefresh) return;
	await activeSpace.refreshActivePlanMeals({ refreshShoppingList: false });
	await activeSpace.refreshActivePlanItems({ refreshShoppingList: true });
}

export async function updateMealPosition(
	activeSpace: ActiveSpaceState,
	mealId: string,
	position: number,
	options?: { skipRefresh?: boolean }
) {
	if (!supabase) throw new Error('Supabase client not available');
	if (!activeSpace || !activeSpace.activeSpace || !activeSpace.activePlanMeals)
		throw new Error('No active space or active plan found');
	if (!mealId) throw new Error('Meal ID not provided');
	if (position < 0) throw new Error('Position must be a non-negative integer');

	// Update the meal position in Supabase
	const { error } = await supabase.from('space_meals').update({ position }).eq('id', mealId);
	if (error) throw new Error('Error updating meal position: ' + error.message);

	// Refresh the active plan meals after updating
	if (options?.skipRefresh) return;
	await activeSpace.refreshActivePlanMeals({ refreshShoppingList: false });
	await activeSpace.refreshActivePlanItems({ refreshShoppingList: true });
}

export async function deleteMeal(
	activeSpace: ActiveSpaceState,
	mealId: string,
	options?: { skipRefresh?: boolean; undo?: boolean }
) {
	if (!supabase) throw new Error('Supabase client not available');
	if (!activeSpace || !activeSpace.activeSpace || !activeSpace.activePlanMeals)
		throw new Error('No active space or active plan found');
	if (!mealId) throw new Error('Meal ID not provided');

	// Optimistically delete the meal in the local state
	if (!options?.undo) activeSpace.activePlanMeals.filter((meal) => meal.id !== mealId);

	// Soft delete related shopping list items first
	const now = new Date().toISOString();
	const { error: shoppingListError } = await supabase
		.from('space_items')
		.update({ deleted_at: options?.undo ? null : now })
		.eq('meal_id', mealId)
		.eq('type', 'meal');

	// TODO update meal positions as they may not go from 1 to N anymore

	if (shoppingListError) {
		throw new Error('Error soft-deleting shopping list items: ' + shoppingListError.message);
	}

	// Now set the deleted_at timestamp for the meal
	const { error } = await supabase
		.from('space_meals')
		.update({ deleted_at: options?.undo ? null : now })
		.eq('id', mealId);
	if (error) throw new Error('Error soft-deleting meal: ' + error.message);

	if (options?.undo) {
		toast.info('Meal restored', { description: 'We got it back!' });
	} else {
		toast.info('Meal deleted', {
			description: 'It looked yummy though',
			action: {
				label: 'Undo',
				onClick: () => deleteMeal(activeSpace, mealId, { skipRefresh: false, undo: true })
			}
		});
	}

	if (options?.skipRefresh) return;
	await activeSpace.refreshActivePlanMeals({ refreshShoppingList: false });
	await activeSpace.refreshActivePlanItems({ refreshShoppingList: true });
}
