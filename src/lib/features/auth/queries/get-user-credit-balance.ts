import type { Database } from '$lib/shared/db/supabase.types';
import type { SupabaseClient } from '@supabase/supabase-js';

export type CommunityHealth = 'Healthy' | 'Low' | 'Critical' | 'Empty';

export async function getUserCreditBalance(
	supabase: SupabaseClient<Database> | undefined,
	userId: string
) {
	if (!supabase) throw new Error('No supabase client');
	if (!userId) throw new Error('User ID not provided');

	const { data: dataBalance, error } = await supabase
		.from('credit_balances')
		.select('*')
		.eq('user_id', userId)
		.maybeSingle();

	if (error) {
		console.error('Error fetching credit log:', error);
		return { balance: null, error };
	}

	const { data: dataHealth, error: errorHealth } = await supabase.rpc('get_public_pool_health');

	const mergedBalance = {
		...dataBalance,
		communityHealth: dataHealth as CommunityHealth | null
	};

	return { balance: mergedBalance || null, error };
}

type UserCreditBalanceReturn =
	ReturnType<typeof getUserCreditBalance> extends Promise<infer T> ? T : never;
export type UserCreditBalance = UserCreditBalanceReturn['balance'];

export async function canUserAfford(
	supabase: SupabaseClient<Database>,
	userId: string,
	cost: number
) {
	const { balance, error: balanceError } = await getUserCreditBalance(supabase, userId);

	if (balanceError) throw new Error(balanceError.message);
	if (cost <= 0) throw new Error('Cost must be positive');

	console.log(balance?.balance, 'user seeds and', balance?.communityHealth, 'health');

	if (!balance?.balance || balance?.balance < cost || balance?.communityHealth === 'Empty') {
		console.log('Not enough private nor public seeds.');
		return false;
	}

	return true;
}
