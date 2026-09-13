import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';

export const profileUpdateAisleOrderInput = z.object({
	userId: z.string(),
	// Matches the `aisle_order` text[] column; keys are validated client-side by
	// `resolveSupermarketAisleOrder` before they reach this op.
	aisleOrder: z.array(z.string())
});

export type ProfileUpdateAisleOrderInput = z.infer<typeof profileUpdateAisleOrderInput>;

async function profileUpdateAisleOrderHandler(
	ctx: OpCtx,
	input: ProfileUpdateAisleOrderInput
): Promise<void> {
	const { userId, aisleOrder } = input;
	if (!userId) return;

	const { error } = await ctx.supabase
		.from('user_preferences')
		.update({ aisle_order: aisleOrder })
		.eq('user_id', userId);

	if (error) {
		throw new OpError('INTERNAL', 'Failed to update aisle order.', error);
	}
}

/**
 * `profile.update-aisle-order` — persist the supermarket aisle display order.
 *
 * Body moved verbatim from
 * `features/user-settings/actions/update-aisle-order.ts:updateAisleOrder`
 * (M2 core migration; behavior unchanged — silent no-op without a user id, and the
 * failure toast stays in the thin adapter because `ShoppingViewSettings` relies on it).
 */
export const profileUpdateAisleOrderOp = defineOp({
	name: 'profile.update-aisle-order',
	domain: 'profile',
	kind: 'write',
	sync: 'later',
	input: profileUpdateAisleOrderInput,
	handler: profileUpdateAisleOrderHandler
});
