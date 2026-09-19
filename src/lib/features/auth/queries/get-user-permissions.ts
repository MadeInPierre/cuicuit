import type { Database } from '$lib/shared/db/supabase.types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * NOTE (M2 core migration): intentionally NOT an op — this is an authz helper
 * (role lookup used for gating), not a user-invoked domain operation, so it stays
 * a direct RLS query. Called from `UserState` (client) and `admin/+layout.server.ts`.
 *
 * ALLOWLISTED against the repo-wide no-direct-DB eslint guard (M6 hardening):
 * the only file outside `src/lib/core/` + `src/lib/sync/` + `src/lib/shared/db/`
 * permitted to touch the database directly. Do not copy this pattern — add a
 * `defineOp` in `src/lib/core/operations/<domain>/<op>.ts` instead.
 */
/* eslint-disable no-restricted-syntax -- M6 allowlist: authz helper, intentionally not an op (see above). */
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
