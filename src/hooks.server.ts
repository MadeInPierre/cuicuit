import { SUPABASE_SECRET_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { type Database } from '$lib/shared/db/supabase.types';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// @supabase/ssr's internal onAuthStateChange subscriber can fire late (e.g. a
	// token refresh or sign-out resolving after the response is generated), which
	// would crash with "Cannot use cookies.set(...) after the response has been
	// generated". Once the response is generated, drop late writes — the next
	// request re-derives the session from the (still valid) cookie.
	let responseGenerated = false;

	event.locals.supabase = createServerClient<Database>(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_PUBLISHABLE_KEY,
		{
			// This client is short-lived (one per request). Auto-refresh/URL detection run
			// asynchronously in the background and can outlive the request, later trying to
			// set cookies on a response that has already been sent. Auth is checked explicitly
			// per-request via `getClaims()`/`getUser()`, so neither behaviour is needed here.
			auth: {
				autoRefreshToken: false,
				detectSessionInUrl: false
			},
			cookies: {
				getAll: () => event.cookies.getAll(),
				/**
				 * Note: You have to add the `path` variable to the
				 * set and remove method due to sveltekit's cookie API
				 * requiring this to be set, setting the path to `/`
				 * will replicate previous/standard behaviour (https://kit.svelte.dev/docs/types#public-types-cookies)
				 */
				setAll: (cookiesToSet, headers) => {
					if (responseGenerated) return;
					cookiesToSet.forEach(({ name, value, options }) => {
						try {
							event.cookies.set(name, value, { ...options, path: '/' });
						} catch {
							// Never let a late cookie write crash the server
						}
					});
					if (Object.keys(headers).length > 0) {
						event.setHeaders(headers);
					}
				}
			}
		}
	);

	// Service-role (admin) client: bypasses RLS and is usable on the server only.
	event.locals.supabaseAdmin = createClient<Database>(PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	});

	const response = await resolve(event, {
		filterSerializedResponseHeaders(name: string) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});

	responseGenerated = true;
	return response;
};
