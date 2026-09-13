import { goto } from '$app/navigation';
import { getClientCtx, runOp } from '$lib/core/operations/client.js';
import { addRecipeToPlanOp } from '$lib/core/operations/plans/add-recipe.js';
import { type ActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
import { supabase } from '$lib/shared/db/supabase-client.svelte';
import { toast } from 'svelte-sonner';

// Thin adapter over the `plans.add-recipe` op. DB work lives in core;
// toast/goto/refresh stay here so callers don't change.

export async function addRecipeToActivePlan(
	space: ActiveSpaceState,
	recipeId: string,
	servings: number,
	options?: { hideToast?: boolean; skipRefresh?: boolean }
) {
	if (!space?.activeSpace || !space.activePlanMeals || !space.activeMember?.user_id) {
		console.error('No active space or active plan found');
		return;
	}
	if (!supabase.client) {
		console.error('No Supabase client found');
		return;
	}

	const activeSpaceId = space.activeSpace.id;

	try {
		await runOp(addRecipeToPlanOp.name, await getClientCtx(), {
			spaceId: activeSpaceId,
			createdBy: space.activeMember.user_id,
			recipeId,
			servings,
			position: space.activePlanMeals.length // Append to the end of the plan
		});
	} catch (error) {
		console.error('Error adding recipe to active plan:', error);
		return;
	}

	if (options?.hideToast !== true) {
		toast.success('Added to plan', {
			description: 'Go to the Plan tab for more',
			action: {
				label: 'View',
				onClick: () => goto('/plan')
			}
		});
	}

	// Refresh the active plan after adding
	if (options?.skipRefresh) return;
	await space.refreshActivePlanMeals();
	await space.refreshActivePlanItems();
}
