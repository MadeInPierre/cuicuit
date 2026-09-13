import { supabase } from '$lib/shared/db/supabase-client.svelte';

import { OpError } from './errors.js';
import type { OpCtx } from './registry.js';

/**
 * Build an `OpCtx` for browser client actions (non-remote `.ts` files that use
 * `supabase.client` directly, e.g. `plans/actions/*`).
 *
 * CLIENT-SAFE module: no `$app/server` import. Server remotes use `requireCtx('app')`
 * from `context.ts`; client actions use this. RLS is enforced by the user's own
 * client either way — `userId` here is informational (parity with server ctx).
 */
export async function getClientCtx(opts?: { signal?: AbortSignal }): Promise<OpCtx> {
	const client = supabase.client;
	if (!client) {
		throw new OpError('UNAUTHENTICATED', 'Supabase client is not initialized.');
	}
	const { data, error } = await client.auth.getUser();
	if (error || !data.user) {
		throw new OpError('UNAUTHENTICATED', 'User must be signed in.');
	}
	return {
		supabase: client,
		userId: data.user.id,
		source: 'app',
		signal: opts?.signal
	};
}
