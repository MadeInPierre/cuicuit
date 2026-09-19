import { getClientCtx, runOp } from '$lib/core/operations/client.js';
import { addItemOp } from '$lib/core/operations/plans/add-item.js';
import type { ActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';

// Thin adapter over the `plans.add-item` op. DB work lives in core;
// refresh stays here so callers don't change.

export async function addShoppingItem(
	space: ActiveSpaceState,
	ingredientId: string | null,
	name: string,
	quantity: number | null = null,
	unit: string | null = null
) {
	let ctx;
	try {
		ctx = await getClientCtx();
	} catch {
		throw new Error('No supabase client');
	}
	if (!space.activeSpace?.id || !space.activeMember?.user_id) {
		console.error('No active space found');
		return;
	}

	try {
		await runOp(addItemOp.name, ctx, {
			spaceId: space.activeSpace.id,
			createdBy: space.activeMember.user_id,
			ingredientId,
			name,
			quantity,
			unit
		});
	} catch (error) {
		console.error('Error adding shopping item:', error);
	}

	// Update UI
	await space.refreshActivePlanItems();
}
