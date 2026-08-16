import { dev } from '$app/environment';
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { supabase } from '$lib/shared/db/supabase-client.svelte';
import type { Database } from '$lib/shared/db/supabase.types';
import { createBrowserClient, isBrowser } from '@supabase/ssr';
import { injectAnalytics } from '@vercel/analytics/sveltekit';
import type { LayoutLoad } from './$types';

injectAnalytics({ mode: dev ? 'development' : 'production' });

export const load: LayoutLoad = async ({ fetch, depends }) => {
	depends('supabase:auth');

	// Server-side auth is handled in hooks.server.ts and the layout server loads
	// via `event.locals.supabase` — creating a second server client here would
	// read a stale cookie snapshot and register an extra auth subscriber.
	if (!isBrowser()) {
		return { supabase: null, claims: null };
	}

	const sb = createBrowserClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
		global: {
			fetch
		}
	});

	// The singleton is browser-only: it's created once per page on the client.
	supabase.client = sb;

	/**
	 * `getClaims` validates the JWT signature locally (for asymmetric keys) once
	 * the relevant signing keys are available or cached, and returns the decoded
	 * claims. While an initial or periodic network request may be required to
	 * fetch or refresh keys, this is both faster and safer than `getSession`,
	 * which does not validate the JWT.
	 */
	const { data: claimsData, error } = await sb.auth.getClaims();
	const claims = error ? null : claimsData?.claims;

	return { supabase: sb, claims };
};
