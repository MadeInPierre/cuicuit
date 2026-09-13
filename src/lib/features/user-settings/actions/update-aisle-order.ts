import { getClientCtx, runOp } from '$lib/core/operations/client.js';
import '$lib/core/operations/profile/update-aisle-order.js';
import type { ProfileUpdateAisleOrderInput } from '$lib/core/operations/profile/update-aisle-order.js';
import type { SupermarketAisleKey } from '$lib/features/recipes/components/consts';
import { toast } from 'svelte-sonner';

/**
 * Thin client adapter over the `profile.update-aisle-order` op (M2 core migration).
 * Same name and signature. Failure toast preserved — `ShoppingViewSettings`
 * relies on the action toasting before it reverts the order.
 */
// Persist the user's preferred supermarket aisle display order
export async function updateAisleOrder(userId: string, aisleOrder: SupermarketAisleKey[]) {
	if (!userId) return;

	try {
		await runOp<ProfileUpdateAisleOrderInput, void>(
			'profile.update-aisle-order',
			await getClientCtx(),
			{ userId, aisleOrder: [...aisleOrder] }
		);
	} catch (error) {
		console.error('Error updating aisle order:', error);
		toast.error('Could not save aisle order. Please try again later.');
		throw error;
	}
}
