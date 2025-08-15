import { type ActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
import { supabase } from '$lib/shared/db/supabase-client';

export async function addRecipeToActivePlan(
	activeSpace: ActiveSpaceState,
	recipeId: string,
	servings: number
) {
	if (!activeSpace || !activeSpace.activeSpace || !activeSpace.activePlan) {
		console.error('No active space or active plan found');
		return;
	}
	if (!supabase) {
		console.error('No Supabase client found');
		return;
	}

	// Add the recipe to the active plan in Supabase
	const { error } = await supabase.from('space_plan_meals').insert({
		space_id: activeSpace.activeSpace.id,
		recipe_id: recipeId,
		servings: servings,
		position: activeSpace.activePlan.length // Append to the end of the plan
	});

	if (error) {
		console.error('Error adding recipe to active plan:', error);
		return;
	}

	// Refresh the active plan meals after adding
	await activeSpace.refreshActivePlan();
}
