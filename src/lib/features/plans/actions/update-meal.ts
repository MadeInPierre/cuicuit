import type { ActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
import { supabase } from '$lib/shared/db/supabase-client';

export async function updateMealServings(
	activeSpace: ActiveSpaceState,
	mealId: string,
	servings: number,
	options?: { skipRefresh?: boolean }
) {
	if (!supabase) throw new Error('Supabase client not available');
	if (!activeSpace || !activeSpace.activeSpace || !activeSpace.activePlanMeals)
		throw new Error('No active space or active plan found');
	if (!mealId) throw new Error('Meal ID not provided');
	if (servings < 1) throw new Error('Servings must be at least 1');

	// Update the meal servings in Supabase
	const { error } = await supabase.from('space_plan_meals').update({ servings }).eq('id', mealId);
	if (error) throw new Error('Error updating meal servings: ' + error.message);

	// Refresh the active plan meals after updating
	if (options?.skipRefresh) return;
	activeSpace.refreshActivePlanMeals();
	activeSpace.refreshActivePlanItems();
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
	const { error } = await supabase.from('space_plan_meals').update({ position }).eq('id', mealId);
	if (error) throw new Error('Error updating meal position: ' + error.message);

	// Refresh the active plan meals after updating
	if (options?.skipRefresh) return;
	activeSpace.refreshActivePlanMeals();
}

export async function deleteMeal(
	activeSpace: ActiveSpaceState,
	mealId: string,
	options?: { skipRefresh?: boolean }
) {
	if (!supabase) throw new Error('Supabase client not available');
	if (!activeSpace || !activeSpace.activeSpace || !activeSpace.activePlanMeals)
		throw new Error('No active space or active plan found');
	if (!mealId) throw new Error('Meal ID not provided');

	const now = new Date().toISOString();

	// Soft delete related shopping list items first
	const { error: shoppingListError } = await supabase
		.from('space_plan_shopping_lists')
		.update({ deleted_at: now })
		.eq('meal_id', mealId)
		.eq('type', 'meal')
		.is('deleted_at', null);

	// TODO update meal positions as they may not go from 1 to N anymore

	if (shoppingListError) {
		throw new Error('Error soft-deleting shopping list items: ' + shoppingListError.message);
	}

	// Now set the deleted_at timestamp for the meal
	const { error } = await supabase
		.from('space_plan_meals')
		.update({ deleted_at: now })
		.eq('id', mealId)
		.is('deleted_at', null);
	if (error) throw new Error('Error soft-deleting meal: ' + error.message);

	if (options?.skipRefresh) return;
	activeSpace.refreshActivePlanMeals();
	activeSpace.refreshActivePlanItems();
}
