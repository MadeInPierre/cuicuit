import type { User } from '@supabase/supabase-js';

export interface CachedClaims {
	sub?: string;
	email?: string;
	exp?: number;
	[key: string]: unknown;
}

export interface CachedSession {
	/** The last-known user, read synchronously from storage. */
	user: User;
	/** `expires_at` (epoch seconds) of the cached session, if known. */
	expiresAt: number | null;
	/** Unverified JWT payload of the cached access token, if parseable. */
	claims: CachedClaims | null;
}

const SESSION_KEY_PATTERN = /^sb-.*-auth-token$/;

/**
 * Reads the last-known Supabase session synchronously from localStorage —
 * no network, so it can seed first paint (skip the splash) instead of
 * awaiting `getClaims()` (which refetches the JWKS on every reload).
 *
 * Trust boundary: the JWT signature is NOT verified here — the result is a
 * render hint only. Real auth decisions stay in the server loads
 * (`getClaims()`) and RLS; the async `onAuthStateChange` cycle confirms or
 * corrects the seed within milliseconds.
 */
export function readCachedSession(): CachedSession | null {
	try {
		if (typeof localStorage === 'undefined') return null;
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (!key || (key !== 'supabase.auth.token' && !SESSION_KEY_PATTERN.test(key))) continue;
			const parsed = JSON.parse(localStorage.getItem(key) ?? 'null') as {
				user?: User;
				expires_at?: number;
				access_token?: string;
			} | null;
			if (!parsed?.user) continue;
			return {
				user: parsed.user,
				expiresAt: typeof parsed.expires_at === 'number' ? parsed.expires_at : null,
				claims: decodePayload(parsed.access_token)
			};
		}
	} catch {
		// Corrupt storage — behave as signed out; the async cycle will confirm.
	}
	return null;
}

function decodePayload(jwt: string | undefined): CachedClaims | null {
	try {
		if (!jwt) return null;
		const payload = jwt.split('.')[1];
		if (!payload) return null;
		const binary = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
		return JSON.parse(new TextDecoder().decode(bytes)) as CachedClaims;
	} catch {
		return null;
	}
}
