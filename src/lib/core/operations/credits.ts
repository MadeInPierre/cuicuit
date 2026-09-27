import type { PaidFeatureKey } from '$lib/features/billing/consts.js';
import { OpError } from './errors.js';
import type { OpCtx } from './registry.js';

/**
 * Credit (seed) gate for paid operations.
 *
 * Two layers, same numbers:
 * 1. fail-fast checks here (`canAfford` + `assertWithinWeeklyLimits`) run
 *    BEFORE the expensive work (LLM import) so users get a clean error;
 * 2. the authoritative guard lives in the `consume_credits` SQL function,
 *    which re-checks under row locks — races can never overspend.
 *
 * Weekly rate limits (keep in sync with `consume_credits` in
 * `supabase/schemas/01_billing.sql`): max 50 community seeds per user per
 * week (everyone), max 1000 private seeds per user per week (supporters).
 * Weeks start Monday 00:00 UTC. Adapters must NEVER call credit consumption
 * directly — the two import ops apply this internally.
 */

/** Max community seeds one user may consume per week (all users). */
export const WEEKLY_COMMUNITY_SEEDS_LIMIT = 50;
/** Max private seeds one user may consume per week (supporters). */
export const WEEKLY_PRIVATE_SEEDS_LIMIT = 1000;

export interface CreditUsage {
	privateCreditsUsed: number;
	publicCreditsUsed: number;
}

/** Monday (UTC) of the current week as `YYYY-MM-DD` — mirrors Postgres `date_trunc('week', …)`. */
export function currentWeekStart(now = new Date()): string {
	const monday = new Date(now);
	monday.setUTCHours(0, 0, 0, 0);
	monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
	return monday.toISOString().slice(0, 10);
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
 * Fail-fast weekly rate-limit check — mirrors the `consume_credits` split
 * (private balance first, overflow to the community pool) against this
 * week's `credit_usage_weekly` row. Throws `RATE_LIMITED` (429).
 */
export async function assertWithinWeeklyLimits(ctx: OpCtx, seeds: number): Promise<void> {
	if (seeds <= 0) throw new OpError('VALIDATION', 'Cost must be positive.');
	const [{ data: balance, error: balanceError }, { data: usage, error: usageError }] =
		await Promise.all([
			ctx.supabase
				.from('credit_balances')
				.select('balance')
				.eq('user_id', ctx.userId)
				.maybeSingle(),
			ctx.supabase
				.from('credit_usage_weekly')
				.select('private_used, public_used')
				.eq('user_id', ctx.userId)
				.eq('week_start', currentWeekStart())
				.maybeSingle()
		]);
	if (balanceError) {
		throw new OpError('INTERNAL', 'Could not check credit balance.', balanceError);
	}
	if (usageError) {
		throw new OpError('INTERNAL', 'Could not check weekly seed usage.', usageError);
	}
	const privateBalance = balance?.balance ?? 0;
	const needPrivate = Math.min(privateBalance, seeds);
	const needPublic = seeds - needPrivate;
	const usedPrivate = usage?.private_used ?? 0;
	const usedPublic = usage?.public_used ?? 0;
	if (usedPublic + needPublic > WEEKLY_COMMUNITY_SEEDS_LIMIT) {
		throw new OpError(
			'RATE_LIMITED',
			`Weekly community seed limit reached (${WEEKLY_COMMUNITY_SEEDS_LIMIT}/week, used ${usedPublic}). Resets Monday 00:00 UTC.`
		);
	}
	if (usedPrivate + needPrivate > WEEKLY_PRIVATE_SEEDS_LIMIT) {
		throw new OpError(
			'RATE_LIMITED',
			`Weekly private seed limit reached (${WEEKLY_PRIVATE_SEEDS_LIMIT}/week, used ${usedPrivate}). Resets Monday 00:00 UTC.`
		);
	}
}

/**
 * Charge seeds via the `consume_credits` RPC (SECURITY DEFINER, service_role
 * only → `ctx.admin`). Single place that parses the RPC result and maps the
 * `RATE_LIMITED` guard to an `OpError`.
 */
export async function consumeSeeds(
	ctx: OpCtx,
	opts: { feature: PaidFeatureKey; seeds: number; metadata?: string }
): Promise<CreditUsage> {
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
		if (error.message?.includes('RATE_LIMITED')) {
			throw new OpError('RATE_LIMITED', error.message.replace(/^RATE_LIMITED:\s*/, ''));
		}
		throw new OpError('INTERNAL', 'Could not consume credits.', error);
	}
	return {
		privateCreditsUsed: data?.[0].private_credits_consumed,
		publicCreditsUsed: data?.[0].public_credits_consumed
	};
}
