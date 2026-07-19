import { supabase } from '$lib/shared/db/supabase-client.svelte';

export async function getUserCreditBalance(userId: string) {
	if (!supabase.client) throw new Error('No supabase client');
	if (!userId) throw new Error('User ID not provided');

	const { data: dataBalance, error } = await supabase.client
		.from('credit_balances')
		.select('*')
		.eq('user_id', userId)
		.single();

	if (error) {
		// No results
		if (error?.code === 'PGRST116') return { balance: null, error: null };

		console.error('Error fetching credit log:', error);
	}

	const { data: dataHealth, error: errorHealth } =
		await supabase.client.rpc('get_public_pool_health');

	const mergedBalance = {
		...dataBalance,
		communityHealth: "Low" as 'Healthy' | 'Low' | 'Critical' | 'Empty' | null
	};

	return { balance: mergedBalance || null, error };
}

type UserCreditBalanceReturn =
	ReturnType<typeof getUserCreditBalance> extends Promise<infer T> ? T : never;
export type UserCreditBalance = UserCreditBalanceReturn['balance'];
