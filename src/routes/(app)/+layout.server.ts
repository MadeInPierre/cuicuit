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
			// Supabase unreachable (offline / flaky network): this is NOT a
			// signed-out user — let them through so the client can render the
			// shell + degraded states instead of bouncing to /login.
			return { url: url.origin, claims: null, preferences: null, offline: true };
		}
	} catch (e) {
		if (!isTransportError(e)) throw e;
		return { url: url.origin, claims: null, preferences: null, offline: true };
	}

	// PROTECTED PAGES: Not logged in at /(app), redirect to /login
	if (!claims) {
		console.log('At /recipes but not logged in, going to /login');
		redirect(303, '/login');
	}

	const userId = claims.sub;

	const { preferences, error: prefError } = await getUserPreferences(supabase, userId);
	if (prefError) {
		if (isTransportError(prefError)) {
			// Claims are valid but the profile is unreachable: let the client
			// render degraded instead of bouncing to /welcome.
			return { url: url.origin, claims, preferences: null, offline: true };
		}
		console.error(prefError);
	}

	// Logged in but doesn't have user data, onboard them
	if (preferences?.onboarding_status !== 'finished') {
		redirect(303, '/welcome');
	}

	// Logged in and user data present, all good
	return { url: url.origin, claims, preferences, offline: false };
};
