/**
 * Shared transport-failure detector for the offline-auth hardening.
 *
 * Server guards (`(app)` / `(auth)` / `admin` layout loads) and client auth
 * state must distinguish "the user is signed out" (→ redirect to /login)
 * from "Supabase is unreachable" (→ render degraded, never redirect-loop).
 *
 * Client- AND server-safe: no browser or server-only imports.
 */
export function isTransportError(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false;

	// supabase-js wraps every failed auth fetch (offline, DNS, timeout) in this.
	if ((error as { name?: unknown }).name === 'AuthRetryableFetchError') return true;

	const message =
		error instanceof Error
			? error.message
			: String((error as { message?: unknown }).message ?? error);
	return /fetch failed|failed to fetch|networkerror|network request failed|load failed|offline|econn|enotfound|etimedout|eai_again|socket hang up|timeout|not connected/i.test(
		message
	);
}
