import type { RecipeDetailed } from '$lib/features/recipes/queries/get-recipe-detailed';
import { type ActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';

export function addRecipeToActivePlan(
	activeSpace: ActiveSpaceState,
	recipe: RecipeDetailed,
	servings: number
) {
	if (!activeSpace || activeSpace.activePlan === undefined) {
		console.error('No active space or active plan found');
		return;
	}

	activeSpace.activePlan.push({
		recipe,
		servings
	});
}
