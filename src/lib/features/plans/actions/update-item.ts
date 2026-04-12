import type { ActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
import { supabase } from '$lib/shared/db/supabase-client';
import { toast } from 'svelte-sonner';

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
		.from('space_items')
		.update({
			checked_at: checked ? new Date().toISOString() : null
		})
		.eq('id', itemId);
	if (error) throw new Error('Error updating plan item: ' + error.message);

	// Refresh the active plan items after updating
	if (options?.skipRefresh) return;
	activeSpace.refreshActivePlanItems();
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
	const { error } = await supabase.from('space_items').update({ deleted_at: now }).eq('id', itemId);

	if (error) throw new Error('Error deleting plan item: ' + error.message);

	toast.success('Item deleted', {
		duration: 5000,
		action: {
			label: 'Undo',
			actionButtonStyle: 'outline',
			onClick: async () => {
				const { error: undoError } = await supabase
					.from('space_items')
					.update({ deleted_at: null })
					.eq('id', itemId)
					.eq('deleted_at', now); // Only undo if it was deleted at the expected time

				if (undoError) {
					toast.error('Error undoing delete: ' + undoError.message);
				} else {
					activeSpace.refreshActivePlanItems();
					activeSpace.refreshActivePlanMeals();
				}
			}
		}
	});

	// Refresh the active plan items after deleting
	if (options?.skipRefresh === true) return;
	activeSpace.refreshActivePlanItems();
	activeSpace.refreshActivePlanMeals();
}
