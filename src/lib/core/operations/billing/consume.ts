import { z } from 'zod';

import { FEATURE_COSTS, type PaidFeatureKey } from '$lib/features/billing/consts.js';

import { consumeSeeds, type CreditUsage } from '../credits.js';
import { OpError } from '../errors.js';
import { defineOp } from '../registry.js';

export const consumeCreditsInput = z.object({
	amount: z.number().min(1).max(5), // No feature should consume more than 5 credits at once at the time of writing
	feature: z.string(),
	metadata: z.string().optional()
});

export type ConsumeCreditsInput = z.infer<typeof consumeCreditsInput>;

export type ConsumeCreditsResult = CreditUsage;

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
 * NOTE: `credits.ts:consumeSeeds` holds the actual `consume_credits` RPC call —
 * this op is just the internal `runOp` door onto it (hot-path import ops call
 * `consumeSeeds` directly to keep streaming).
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
		const key = feature as PaidFeatureKey;
		if (!FEATURE_COSTS[key]) throw new OpError('VALIDATION', `Unknown feature: ${feature}.`);
		return consumeSeeds(ctx, { feature: key, seeds: amount, metadata });
	}
});
