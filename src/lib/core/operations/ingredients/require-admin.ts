import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '$lib/shared/db/supabase.types';

import { OpError } from '../errors.js';
import type { OpCtx } from '../registry.js';

/**
 * Admin guard for the ingredient management ops (M1).
 *
 * `ingredients`, `ingredient_translations` and `ingredient_substitutions` are
 * SELECT-only for `authenticated` (see `supabase/schemas/99_RLS.sql`) — writes
 * go through the service-role client, so every admin op starts here. Throws
 * `FORBIDDEN` for non-admins (never `NOT_FOUND`: these ops are admin-only, so
 * existence leaks are not a concern) and `INTERNAL` when called without a
 * server context (no `ctx.admin`).
 *
 * Returns the service-role client to run the privileged queries with.
 */
export async function requireAdmin(ctx: OpCtx): Promise<SupabaseClient<Database>> {
	if (!ctx.admin) {
		throw new OpError('INTERNAL', 'Admin operation requires a server context.');
	}
	const { data, error } = await ctx.admin
		.from('user_permissions')
		.select('role')
		.eq('user_id', ctx.userId)
		.maybeSingle();
	if (error) {
		throw new OpError('INTERNAL', 'Failed to verify admin permissions.', error);
	}
	if (!data || data.role !== 'admin') {
		throw new OpError('FORBIDDEN', 'Admin access required.');
	}
	return ctx.admin;
}

/**
 * Client-side admin fast-fail for browser-direct ops (`ingredients.upload-image`).
 *
 * Reads the caller's own `user_permissions` row — permitted by the RLS
 * self-read policy — and throws `FORBIDDEN` for non-admins. This is UX only:
 * the real enforcement for the upload path is the admin-gated storage RLS
 * policy (`99_RLS.sql`), which rejects non-admin writes server-side even if
 * this check is bypassed.
 */
export async function requireAdminSelf(ctx: OpCtx): Promise<void> {
	const { data, error } = await ctx.supabase
		.from('user_permissions')
		.select('role')
		.eq('user_id', ctx.userId)
		.maybeSingle();
	if (error) {
		throw new OpError('INTERNAL', 'Failed to verify admin permissions.', error);
	}
	if (!data || data.role !== 'admin') {
		throw new OpError('FORBIDDEN', 'Admin access required.');
	}
}
