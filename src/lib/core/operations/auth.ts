import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';

import { serverIsUserAuthenticated as serverIsUserAuthenticatedBase } from '$lib/features/billing/server/utils/is-user-authenticated';
import type { Database } from '$lib/shared/db/supabase.types';

import { hashPat, isPatFormat } from './auth/pats.js';
import { OpError } from './errors.js';

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
 * Resolve a `cui_...` Personal Access Token to a user id.
 *
 * Looks up the SHA-256 hash via the service-role client (RLS never sees PATs;
 * per-request data access still goes through the user's JWT, so data-table RLS
 * holds). Rejects unknown and revoked tokens with `UNAUTHENTICATED`, and bumps
 * `last_used_at` fire-and-forget.
 */
export async function resolvePatToken(
	token: string,
	admin: SupabaseClient<Database>
): Promise<string> {
	if (!isPatFormat(token)) {
		throw new OpError('UNAUTHENTICATED', 'Invalid API token format.');
	}
	const { data, error } = await admin
		.from('user_api_tokens')
		.select('user_id, revoked_at')
		.eq('token_hash', await hashPat(token))
		.maybeSingle();
	if (error || !data) {
		throw new OpError('UNAUTHENTICATED', 'Invalid API token.');
	}
	if (data.revoked_at) {
		throw new OpError('UNAUTHENTICATED', 'API token has been revoked.');
	}
	const tokenHash = await hashPat(token);
	void admin
		.from('user_api_tokens')
		.update({ last_used_at: new Date().toISOString() })
		.eq('token_hash', tokenHash);
	return data.user_id;
}

/**
 * A real GoTrue user session minted for a PAT-authenticated request, so
 * PostgREST enforces exactly the same RLS as a normal user session
 * (`auth.uid()` = token owner).
 *
 * Why a real session instead of a hand-signed JWT: Supabase's new JWT signing
 * keys are asymmetric and the private key never leaves Supabase, so there is
 * no secret we could sign with (the legacy `SUPABASE_JWT_SECRET` is revoked).
 * Instead we ask GoTrue itself — via service-role admin APIs — to create a
 * session for the token owner and hand us its access token. This works
 * identically on local Supabase and on Cloud, with zero key management.
 *
 * `cleanup` revokes the session (fire-and-forget, never throws). Callers must
 * run it when the request is done — otherwise every PAT request leaks one
 * session row into `auth.sessions`. Idempotent.
 */
export interface PatSession {
	jwt: string;
	cleanup: () => void;
}

export async function exchangePatForUserJwt(
	admin: SupabaseClient<Database>,
	userId: string
): Promise<PatSession> {
	const { data: userData, error: userError } = await admin.auth.admin.getUserById(userId);
	const email = userData?.user?.email;
	if (userError || !email) {
		throw new OpError('UNAUTHENTICATED', 'Invalid API token.');
	}
	// `generateLink` mints the login token WITHOUT sending any email.
	const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
		type: 'magiclink',
		email
	});
	const tokenHash = linkData?.properties?.hashed_token;
	if (linkError || !tokenHash) {
		throw new OpError('UNAUTHENTICATED', 'Invalid API token.');
	}
	// Throwaway client: exchanging the token here must not touch the shared
	// admin client's auth state.
	const probe = createClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
		auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
	});
	const { data: sessionData, error: sessionError } = await probe.auth.verifyOtp({
		type: 'magiclink',
		token_hash: tokenHash
	});
	const jwt = sessionData?.session?.access_token;
	if (sessionError || !jwt) {
		throw new OpError('UNAUTHENTICATED', 'Invalid API token.');
	}
	let cleaned = false;
	const cleanup = () => {
		if (cleaned) return;
		cleaned = true;
		// Scope 'local': revoke ONLY this minted session. The default ('global')
		// would sign the user out everywhere, including their browser session.
		void admin.auth.admin
			.signOut(jwt, 'local')
			.then(({ error }) => {
				if (error) console.warn('[api] PAT session cleanup failed:', error.message);
			})
			.catch((error) => console.warn('[api] PAT session cleanup failed:', error));
	};
	return { jwt, cleanup };
}
