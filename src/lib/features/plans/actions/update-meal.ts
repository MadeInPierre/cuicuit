import type { ActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
import { supabase } from '$lib/shared/db/supabase-client';

export async function updateMealServings(
	activeSpace: ActiveSpaceState,
	mealId: string,
	servings: number
) {
	if (!supabase) throw new Error('Supabase client not available');
	if (!activeSpace || !activeSpace.activeSpace || !activeSpace.activePlan)
		throw new Error('No active space or active plan found');
	if (!mealId) throw new Error('Meal ID not provided');
	if (servings < 1) throw new Error('Servings must be at least 1');

	// Update the meal servings in Supabase
	const { data, error } = await supabase
		.from('space_plan_meals')
		.update({ servings })
		.eq('id', mealId);

	// Refresh the active plan meals after updating
	await activeSpace.refreshActivePlan();

	if (error) throw new Error('Error updating meal servings: ' + error.message);
	return data;
}

export async function updateMealPosition(
	activeSpace: ActiveSpaceState,
	mealId: string,
	position: number
) {
	if (!supabase) throw new Error('Supabase client not available');
	if (!activeSpace || !activeSpace.activeSpace || !activeSpace.activePlan)
		throw new Error('No active space or active plan found');
	if (!mealId) throw new Error('Meal ID not provided');
	if (position < 0) throw new Error('Position must be a non-negative integer');

	// Update the meal position in Supabase
	const { data, error } = await supabase
		.from('space_plan_meals')
		.update({ position })
		.eq('id', mealId);

	// Refresh the active plan meals after updating
	await activeSpace.refreshActivePlan();

	if (error) throw new Error('Error updating meal position: ' + error.message);
	return data;
}

export async function deleteMeal(activeSpace: ActiveSpaceState, mealId: string) {
	if (!supabase) throw new Error('Supabase client not available');
	if (!activeSpace || !activeSpace.activeSpace || !activeSpace.activePlan)
		throw new Error('No active space or active plan found');
	if (!mealId) throw new Error('Meal ID not provided');

	// Delete the meal from Supabase
	const { data, error } = await supabase.from('space_plan_meals').delete().eq('id', mealId);

	// Refresh the active plan meals after deletion
	await activeSpace.refreshActivePlan();

	if (error) throw new Error('Error deleting meal: ' + error.message);
	return data;
}
