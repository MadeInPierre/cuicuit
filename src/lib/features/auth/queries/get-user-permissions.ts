import type { Database } from '$lib/shared/db/supabase.types';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function getUserPermissions(supabase: SupabaseClient<Database>, userId: string) {
	if (!userId) throw new Error('User ID not provided');

	const { data: permissions, error } = await supabase
		.from('user_permissions')
		.select('*')
		.eq('user_id', userId)
		.single();

	if (error) {
		// No results
		if (error?.code === 'PGRST116') return { permissions: null, error: null };

		console.error('Error fetching user permissions:', error);
	}

	return { permissions: permissions || null, error };
}

type UserPermissionsReturn =
	ReturnType<typeof getUserPermissions> extends Promise<infer T> ? T : never;
export type UserPermissions = UserPermissionsReturn['permissions'];
