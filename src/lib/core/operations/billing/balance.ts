import { z } from 'zod';

import type { Database } from '$lib/shared/db/supabase.types';
import type { PostgrestError } from '@supabase/supabase-js';

import { defineOp } from '../registry.js';

export type CommunityHealth = 'Healthy' | 'Low' | 'Critical' | 'Empty';

type BalanceRow = Database['public']['Tables']['credit_balances']['Row'];

export type UserCreditBalance =
	| (Partial<BalanceRow> & {
			balance: number;
			communityHealth: CommunityHealth | null;
	  })
	| null;

export interface BalanceResult {
	balance: UserCreditBalance;
	error: PostgrestError | null;
}

export const balanceInput = z.object({});

export type BalanceInput = z.infer<typeof balanceInput>;

/**
 * `billing.balance` — read-only seed balance + community pool health.
 *
 * Body moved verbatim from
 * `src/lib/features/auth/queries/get-user-credit-balance.ts:getUserCreditBalance`
 * (`supabase`/`userId` args become `ctx.supabase`/`ctx.userId`). Return shape
 * `{ balance, error }` is preserved 1:1 — a failed balance read returns
 * `{ balance: null, error }` instead of throwing, exactly like the original.
 */
export const balanceOp = defineOp({
	name: 'billing.balance',
	domain: 'billing',
	kind: 'read',
	sync: 'server-only',
	input: balanceInput,
	handler: async (ctx): Promise<BalanceResult> => {
		const { data: dataBalance, error } = await ctx.supabase
			.from('credit_balances')
			.select('*')
			.eq('user_id', ctx.userId)
			.maybeSingle();

		if (error) {
			console.error('Error fetching credit log:', error);
			return { balance: null, error };
		}

		const { data: dataHealth } = await ctx.supabase.rpc('get_public_pool_health');

		const mergedBalance = {
			...dataBalance,
			balance: dataBalance?.balance || 0, // In case the balance is null, default to 0
			communityHealth: dataHealth as CommunityHealth | null
		};

		return { balance: mergedBalance || null, error };
	}
});
