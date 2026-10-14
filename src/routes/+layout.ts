import { dev } from '$app/environment';
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { readCachedSession } from '$lib/features/auth/cached-session';
import { supabase } from '$lib/shared/db/supabase-client.svelte';
import type { Database } from '$lib/shared/db/supabase.types';
import { createBrowserClient, isBrowser } from '@supabase/ssr';
import { injectAnalytics } from '@vercel/analytics/sveltekit';
import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
import type { LayoutLoad } from './$types';

injectAnalytics({ mode: dev ? 'development' : 'production' });
injectSpeedInsights();

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
	 * Deliberately no network on the critical path: `getClaims()` refetches
	 * the JWKS (`/.well-known/jwks.json`) on every hard reload, so we store 
	 * the session in localStorage to guess the user state offline & skip the
	 * splash screen waiting time.
	 */
	return { supabase: sb, claims: readCachedSession()?.claims ?? null };
};
