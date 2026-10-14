import { isTransportError } from '$lib/features/auth/offline-error';
import { getUserPreferences } from '$lib/features/auth/queries/get-user-preferences';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url, locals: { supabase } }) => {
	let claims = null;

	try {
		const { data, error } = await supabase.auth.getClaims();
		if (!error) {
			claims = data?.claims ?? null;
		} else if (isTransportError(error)) {
			// Supabase unreachable: not a signed-out user — render the page
			// (login/signup show their offline hint) instead of redirecting.
			return { url: url.origin, offline: true };
		}
	} catch (e) {
		if (!isTransportError(e)) throw e;
		return { url: url.origin, offline: true };
	}

	// PROTECTED PAGES: If the user is logged in...
	if (claims) {
		const userId = claims.sub;

		const { preferences, error: prefError } = await getUserPreferences(supabase, userId);
		if (prefError) {
			if (isTransportError(prefError)) return { url: url.origin, offline: true };
			console.error(prefError);
		}
		// console.log('Server check at /(auth):', url.pathname, claims, preferences);

		// If the user is already logged and has its account created, go to app
		if (preferences?.onboarding_status === 'finished') redirect(303, '/recipes');
		// Logged in but no data yet, make the user setup their account
		else if (!url.pathname.startsWith('/welcome')) redirect(303, '/welcome');
	}

	// Not logged in at /welcome, redirect to login
	else if (url.pathname.startsWith('/welcome')) {
		console.log('At /welcome but not logged in, going to /login');
		redirect(303, '/login');
	}

	// Not logged in, all good
	return { url: url.origin, offline: false };
};
