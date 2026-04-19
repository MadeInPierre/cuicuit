import type { ActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
import { supabase } from '$lib/shared/db/supabase-client';
import { toast } from 'svelte-sonner';

export async function updatePlanItemChecked(
	activeSpace: ActiveSpaceState,
	itemId: string,
	checked: boolean,
	options?: { skipRefresh?: boolean; showToast?: boolean }
): Promise<() => Promise<void>> {
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

	const undoFn = async () => {
		const { error: undoError } = await supabase
			.from('space_items')
			.update({
				checked_at: checked ? null : new Date().toISOString()
			})
			.eq('id', itemId);

		if (undoError) {
			toast.error('Error undoing check: ' + undoError.message);
		} else {
			await activeSpace.refreshActivePlanItems({ refreshShoppingList: false });
			await activeSpace.refreshActivePlanMeals({ refreshShoppingList: true });
		}
	};

	if (options?.showToast) {
		toast.success(checked ? 'Item checked' : 'Item unchecked', {
			duration: 5000,
			action: {
				label: 'Undo',
				actionButtonStyle: 'outline',
				onClick: undoFn
			}
		});
	}

	// Refresh the active plan items after updating
	if (!options?.skipRefresh) {
		await activeSpace.refreshActivePlanItems({ refreshShoppingList: false });
		await activeSpace.refreshActivePlanMeals({ refreshShoppingList: true });
	}
	return undoFn;
}

export async function updatePlanItemDeleted(
	activeSpace: ActiveSpaceState,
	itemId: string,
	deleted: boolean = true,
	options?: { skipRefresh?: boolean; showToast?: boolean }
): Promise<() => Promise<void>> {
	if (!supabase) throw new Error('Supabase client not available');
	if (!activeSpace || !activeSpace.activeSpace || !activeSpace.activePlanItems)
		throw new Error('No active space or active plan found');
	if (!itemId) throw new Error('Item ID not provided');

	const now = new Date().toISOString();

	// Soft delete the plan item
	const { error } = await supabase
		.from('space_items')
		.update({ deleted_at: deleted ? now : null })
		.eq('space_id', activeSpace.activeSpace.id)
		.eq('id', itemId);

	if (error) throw new Error('Error deleting plan item: ' + error.message);

	const undoFn = async () => {
		const { error: undoError } = await supabase
			.from('space_items')
			.update({ deleted_at: deleted ? null : now })
			.eq('id', itemId)
			.eq('deleted_at', now); // Only undo if it was deleted at the expected time

		if (undoError) {
			toast.error('Error undoing delete: ' + undoError.message);
		} else {
			await activeSpace.refreshActivePlanItems({ refreshShoppingList: false });
			await activeSpace.refreshActivePlanMeals({ refreshShoppingList: true });
		}
	};

	if (options?.showToast) {
		toast.success('Item deleted', {
			duration: 5000,
			action: {
				label: 'Undo',
				actionButtonStyle: 'outline',
				onClick: undoFn
			}
		});
	}

	// Refresh the active plan items after deleting
	if (!options?.skipRefresh) {
		await activeSpace.refreshActivePlanItems({ refreshShoppingList: false });
		await activeSpace.refreshActivePlanMeals({ refreshShoppingList: true });
	}
	return undoFn;
}
