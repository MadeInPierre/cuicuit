import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { importJWK, SignJWT } from 'jose';

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
	void admin
		.from('user_api_tokens')
		.update({ last_used_at: new Date().toISOString() })
		.eq('token_hash', await hashPat(token));
	return data.user_id;
}

/**
 * Sign a short-lived user JWT for a PAT-authenticated request, so PostgREST
 * enforces exactly the same RLS as a normal user session
 * (`auth.uid()` = token owner).
 *
 * The private ES256 key is ours: generated once via
 * `supabase gen signing-key --algorithm ES256`, imported into Supabase as a
 * JWT signing key (Dashboard → JWT signing keys → new standby key → Rotate),
 * and stored in `SUPABASE_PAT_JWT_PRIVATE_KEY` (full JWK JSON, including `d`
 * and `kid`). Supabase never reveals its own private keys, so bringing our
 * own is the only way to sign locally. No GoTrue calls, no sessions, no
 * cleanup, nothing to rate-limit — one DB lookup (`resolvePatToken`) + pure
 * local signing per request.
 */
export async function signPatJwt(userId: string, keyJson?: string): Promise<string> {
	const raw = keyJson ?? env.SUPABASE_PAT_JWT_PRIVATE_KEY;
	if (!raw) {
		throw new OpError(
			'INTERNAL',
			'PAT signing key not configured. Set SUPABASE_PAT_JWT_PRIVATE_KEY (full ES256 JWK JSON from `supabase gen signing-key`) and import it as a JWT signing key. See .env.example.'
		);
	}
	let jwk: Record<string, unknown>;
	try {
		jwk = JSON.parse(raw) as Record<string, unknown>;
	} catch {
		throw new OpError('INTERNAL', 'SUPABASE_PAT_JWT_PRIVATE_KEY is not valid JSON.');
	}
	if (
		jwk.kty !== 'EC' ||
		typeof jwk.kid !== 'string' ||
		typeof jwk.d !== 'string' ||
		typeof jwk.x !== 'string' ||
		typeof jwk.y !== 'string'
	) {
		throw new OpError(
			'INTERNAL',
			'SUPABASE_PAT_JWT_PRIVATE_KEY must be a full ES256 private JWK (needs `kty: "EC"`, `kid`, `d`, `x`, `y`).'
		);
	}
	let key;
	try {
		// Rebuild a minimal JWK: stored keys may carry `key_ops: ["sign","verify"]`
		// (e.g. extracted from GOTRUE_JWT_KEYS), which WebCrypto rejects on
		// private-key import — `verify` is a public-key operation.
		const { crv, x, y, d } = jwk as Record<string, string>;
		key = await importJWK({ kty: 'EC', crv, x, y, d }, 'ES256');
	} catch (error) {
		throw new OpError('INTERNAL', 'SUPABASE_PAT_JWT_PRIVATE_KEY could not be imported.', error);
	}
	return await new SignJWT({ role: 'authenticated', aud: 'authenticated' })
		.setProtectedHeader({ alg: 'ES256', kid: jwk.kid, typ: 'JWT' })
		.setSubject(userId)
		.setIssuedAt()
		.setExpirationTime('15m')
		.sign(key);
}
