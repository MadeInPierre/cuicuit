import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp } from '../registry.js';

export const consumeCreditsInput = z.object({
	amount: z.number().min(1).max(5), // No feature should consume more than 5 credits at once at the time of writing
	feature: z.string(),
	metadata: z.string().optional()
});

export type ConsumeCreditsInput = z.infer<typeof consumeCreditsInput>;

export interface ConsumeCreditsResult {
	privateCreditsUsed: number | undefined;
	publicCreditsUsed: number | undefined;
}

/**
 * `billing.consume` — charge seeds via the `consume_credits` RPC (internal,
 * service_role only, never exposed to API/MCP).
 *
 * Body moved verbatim from
 * `src/lib/features/billing/server/consume-credits.remote.ts:consumeCredits`.
 * Auth (confirmed-email check via `serverIsUserAuthenticated`) now lives in
 * `requireCtx('app')` → `requireUserId`, which runs the same check before the
 * handler; the handler assumes `ctx.userId` is verified.
 *
 * NOTE: `credits.ts:withCredits` calls the same `consume_credits` RPC directly
 * instead of routing through `runOp('billing.consume', ...)` — intentional
 * (hot path, avoids indirection), not duplication to "fix".
 */
export const consumeOp = defineOp({
	name: 'billing.consume',
	domain: 'billing',
	kind: 'rpc',
	sync: 'server-only',
	docs: {
		title: 'Consume credits',
		description: 'Charges seeds via the consume_credits RPC for a feature.'
	},
	input: consumeCreditsInput,
	internal: true,
	handler: async (ctx, { amount, feature, metadata }): Promise<ConsumeCreditsResult> => {
		console.log('Consuming credits', amount, feature, metadata);

		if (!ctx.admin) {
			throw new OpError('INTERNAL', 'Credit consumption requires a server context.');
		}

		// consume_credits is SECURITY DEFINER and only callable by service_role
		// (revoked from PUBLIC/anon/authenticated), so it must go through the admin client.
		const { data, error } = await ctx.admin.rpc('consume_credits', {
			p_amount_to_consume: amount,
			p_source: feature,
			p_user_id: ctx.userId,
			p_metadata: metadata
		});

		if (error) {
			console.error(error);
			throw new OpError('INTERNAL', 'Could not consume credits', error);
		}

		return {
			privateCreditsUsed: data?.[0].private_credits_consumed,
			publicCreditsUsed: data?.[0].public_credits_consumed
		};
	}
});
