import type { SupabaseClient } from '@supabase/supabase-js';

import { runOp, type OpCtx } from '$lib/core/operations/client.js';
import '$lib/core/operations/billing/balance.js';
import type {
	BalanceInput,
	BalanceResult,
	CommunityHealth,
	UserCreditBalance
} from '$lib/core/operations/billing/balance.js';
import type { Database } from '$lib/shared/db/supabase.types';

export type { CommunityHealth, UserCreditBalance };

/** Thin client-safe wrapper over `billing.balance` — same export, same shape. */
export async function getUserCreditBalance(
	supabase: SupabaseClient<Database> | undefined,
	userId: string
) {
	if (!supabase) throw new Error('No supabase client');
	if (!userId) throw new Error('User ID not provided');

	const ctx: OpCtx = { supabase, userId, source: 'app' };
	return runOp<BalanceInput, BalanceResult>('billing.balance', ctx, {});
}

export async function canUserAfford(
	supabase: SupabaseClient<Database>,
	userId: string,
	cost: number
) {
	const { balance, error: balanceError } = await getUserCreditBalance(supabase, userId);

	if (balanceError) throw new Error(balanceError.message);
	if (cost <= 0) throw new Error('Cost must be positive');

	console.log(balance?.balance, 'user seeds and', balance?.communityHealth, 'health');

	if ((!balance?.balance || balance?.balance < cost) && balance?.communityHealth === 'Empty') {
		console.log('Not enough private nor public seeds.');
		return false;
	}

	return true;
}
