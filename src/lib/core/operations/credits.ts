import { OpError } from './errors.js';
import type { OpCtx } from './registry.js';

/**
 * Credit (seed) gate for paid operations — REAL implementation (M2).
 *
 * Semantics moved verbatim from `import-from-url.remote.ts`:
 * 1. check the user can afford the feature (private balance OR non-empty public pool),
 * 2. run the operation,
 * 3. charge once via the `consume_credits` RPC (SECURITY DEFINER → `ctx.admin` only).
 *
 * Adapters must NEVER call credit consumption directly — the two import ops
 * (`recipes.import-from-url`, `recipes.import-from-text`) apply this internally.
 */
export interface CreditUsage {
	privateCreditsUsed: number;
	publicCreditsUsed: number;
}

/** Mirrors `canUserAfford` (`features/auth/queries/get-user-credit-balance.ts`). */
export async function canAfford(ctx: OpCtx, seeds: number): Promise<boolean> {
	if (seeds <= 0) throw new OpError('VALIDATION', 'Cost must be positive.');
	const { data: balance, error: balanceError } = await ctx.supabase
		.from('credit_balances')
		.select('*')
		.eq('user_id', ctx.userId)
		.maybeSingle();
	if (balanceError) {
		throw new OpError('INTERNAL', 'Could not check credit balance.', balanceError);
	}
	const { data: health } = await ctx.supabase.rpc('get_public_pool_health');
	if ((!balance?.balance || balance.balance < seeds) && health === 'Empty') {
		return false;
	}
	return true;
}

/**
 * Run `fn` only if affordable, then charge. Returns `{ result, usage }` —
 * import ops spread this as `{ ...result, usage }` to preserve the wire shape.
 */
export async function withCredits<T>(
	ctx: OpCtx,
	opts: { feature: string; seeds: number; metadata?: string },
	fn: () => Promise<T>
): Promise<{ result: T; usage: CreditUsage }> {
	if (!(await canAfford(ctx, opts.seeds))) {
		throw new OpError('INSUFFICIENT_SEEDS', 'User cannot afford the feature.');
	}
	const result = await fn();
	if (!ctx.admin) {
		throw new OpError('INTERNAL', 'Credit consumption requires a server context.');
	}
	// `consume_credits` is SECURITY DEFINER and only callable by service_role
	// (revoked from PUBLIC/anon/authenticated), so it must go through the admin client.
	const { data, error } = await ctx.admin.rpc('consume_credits', {
		p_amount_to_consume: opts.seeds,
		p_source: opts.feature,
		p_user_id: ctx.userId,
		p_metadata: opts.metadata
	});
	if (error) {
		throw new OpError('INTERNAL', 'Could not consume credits.', error);
	}
	return {
		result,
		usage: {
			privateCreditsUsed: data?.[0].private_credits_consumed,
			publicCreditsUsed: data?.[0].public_credits_consumed
		}
	};
}
