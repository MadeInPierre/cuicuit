import type { ActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
import { supabase } from '$lib/shared/db/supabase-client';

export async function updatePlanItemChecked(
	activeSpace: ActiveSpaceState,
	itemId: string,
	checked: boolean,
	options?: { skipRefresh?: boolean }
) {
	if (!supabase) throw new Error('Supabase client not available');
	if (!activeSpace || !activeSpace.activeSpace || !activeSpace.activePlanItems)
		throw new Error('No active space or active plan found');
	if (!itemId) throw new Error('Item ID not provided');

	// Update the plan item in Supabase
	const { error } = await supabase
		.from('space_plan_shopping_lists')
		.update({ checked })
		.eq('id', itemId);
	if (error) throw new Error('Error updating plan item: ' + error.message);

	// Refresh the active plan items after updating
	if (options?.skipRefresh) return;
	await activeSpace.refreshActivePlanItems();
}

export async function deletePlanItem(
	activeSpace: ActiveSpaceState,
	itemId: string,
	options?: { skipRefresh?: boolean }
) {
	if (!supabase) throw new Error('Supabase client not available');
	if (!activeSpace || !activeSpace.activeSpace || !activeSpace.activePlanItems)
		throw new Error('No active space or active plan found');
	if (!itemId) throw new Error('Item ID not provided');

	const now = new Date().toISOString();

	// Soft delete the plan item
	const { error } = await supabase
		.from('space_plan_shopping_lists')
		.update({ deleted_at: now })
		.eq('id', itemId);

	if (error) throw new Error('Error deleting plan item: ' + error.message);

	// Refresh the active plan items after deleting
	if (options?.skipRefresh) return;
	await activeSpace.refreshActivePlanItems();
}
