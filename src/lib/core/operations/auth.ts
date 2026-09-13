import type { SupabaseClient } from '@supabase/supabase-js';

import { serverIsUserAuthenticated as serverIsUserAuthenticatedBase } from '$lib/features/billing/server/utils/is-user-authenticated';

import { OpError } from './errors.js';

/**
 * Re-exported seam: M1 keeps the single implementation where it is
 * (`features/billing/server/utils/is-user-authenticated.ts`); M2 may relocate it
 * under core. All future code imports from here.
 */
export const serverIsUserAuthenticated = serverIsUserAuthenticatedBase;

/** Resolve the user id or throw `UNAUTHENTICATED` — the only auth entry core handlers need. */
export async function requireUserId(supabase: SupabaseClient): Promise<string> {
	try {
		const { userId } = await serverIsUserAuthenticatedBase(supabase);
		return userId;
	} catch {
		throw new OpError('UNAUTHENTICATED', 'User must be signed in with a confirmed email.');
	}
}

/**
 * Resolve a `pat_...` Personal Access Token to a user id.
 * STUB (M1) — real implementation in M3 with the `user_api_tokens` table.
 */
export async function resolvePatToken(token: string): Promise<string> {
	void token;
	throw new OpError('INTERNAL', 'TODO(auth-tokens): PAT resolution not implemented until M3.');
}
