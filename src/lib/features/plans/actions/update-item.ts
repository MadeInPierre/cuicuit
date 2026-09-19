import { getClientCtx, runOp } from '$lib/core/operations/client.js';
import { checkItemOp } from '$lib/core/operations/plans/check-item.js';
import {
	deleteItemOp,
	type DeleteItemInput,
	type DeleteItemOutput
} from '$lib/core/operations/plans/delete-item.js';
import type { ActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
import { toast } from 'svelte-sonner';

// Thin adapters over the `plans.check-item` / `plans.delete-item` ops.
// DB work lives in core; toast and refresh stay here so callers don't change.

export async function updatePlanItemChecked(
	activeSpace: ActiveSpaceState,
	itemId: string,
	checked: boolean,
	options?: { skipRefresh?: boolean; showToast?: boolean }
): Promise<() => Promise<void>> {
	let ctx;
	try {
		ctx = await getClientCtx();
	} catch {
		throw new Error('Supabase client not available');
	}
	if (!activeSpace || !activeSpace.activeSpace || !activeSpace.activePlanItems)
		throw new Error('No active space or active plan found');
	if (!itemId) throw new Error('Item ID not provided');

	await runOp(checkItemOp.name, ctx, { itemId, checked });

	const undoFn = async (toastId?: string | number) => {
		const ctx = await getClientCtx();
		try {
			await runOp(checkItemOp.name, ctx, { itemId, checked, undo: true });
		} catch (undoError) {
			toast.error(
				'Error undoing check: ' +
					(undoError instanceof Error ? undoError.message : String(undoError))
			);
			return;
		}
		toast.success('Restored item', {
			description: 'We got it back!',
			id: toastId,
			duration: 5000
		});
		await activeSpace.refreshActivePlanItems({ refreshShoppingList: false });
		await activeSpace.refreshActivePlanMeals({ refreshShoppingList: true });
	};

	if (options?.showToast) {
		const tid = toast.success(checked ? 'Item checked' : 'Item unchecked', {
			duration: 5000,
			action: {
				label: 'Undo',
				actionButtonStyle: 'outline',
				onClick: () => undoFn(tid)
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
	options?: { skipRefresh?: boolean; hideToast?: boolean }
): Promise<() => Promise<void>> {
	let ctx;
	try {
		ctx = await getClientCtx();
	} catch {
		throw new Error('Supabase client not available');
	}
	if (!activeSpace || !activeSpace.activeSpace || !activeSpace.activePlanItems)
		throw new Error('No active space or active plan found');
	if (!itemId) throw new Error('Item ID not provided');

	const result = await runOp<DeleteItemInput, DeleteItemOutput>(deleteItemOp.name, ctx, {
		itemId,
		spaceId: activeSpace.activeSpace.id,
		deleted,
		undo: false
	});

	const undoFn = async (toastId?: string | number) => {
		const ctx = await getClientCtx();
		try {
			await runOp<DeleteItemInput, DeleteItemOutput>(deleteItemOp.name, ctx, {
				itemId,
				deleted,
				undo: true,
				expectedDeletedAt: result.deletedAt
			});
		} catch (undoError) {
			toast.error(
				'Error undoing delete: ' +
					(undoError instanceof Error ? undoError.message : String(undoError))
			);
			return;
		}
		toast.success('Restored item', {
			description: 'We got it back!',
			id: toastId,
			duration: 5000
		});
		await activeSpace.refreshActivePlanItems({ refreshShoppingList: false });
		await activeSpace.refreshActivePlanMeals({ refreshShoppingList: true });
	};

	if (!options?.hideToast) {
		const tid = toast.success('Item deleted', {
			duration: 5000,
			action: {
				label: 'Undo',
				actionButtonStyle: 'outline',
				onClick: () => undoFn(tid)
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
