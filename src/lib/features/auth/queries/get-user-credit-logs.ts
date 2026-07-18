import { supabase } from '$lib/shared/db/supabase-client.svelte';

export async function getUserCreditLogs(userId: string, limit: number = 100) {
	if (!supabase.client) throw new Error('No supabase client');
	if (!userId) throw new Error('User ID not provided');

	const { data: dataLogs, error } = await supabase.client
		.from('credit_logs')
		.select('*')
		.eq('user_id', userId)
		.order('created_at', { ascending: false })
		.limit(limit);

	if (error) {
		// No results
		if (error?.code === 'PGRST116') return { logs: null, error: null };

		console.error('Error fetching credit log:', error);
	}

	return { logs: dataLogs || null, error };
}

type UserCreditLogsReturn =
	ReturnType<typeof getUserCreditLogs> extends Promise<infer T> ? T : never;
export type UserCreditLogs = UserCreditLogsReturn['logs'];
