import { getUserPreferences } from '$lib/features/auth/queries/get-user-preferences';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url, locals: { supabase } }) => {
	const { data, error } = await supabase.auth.getClaims();

	// PROTECTED PAGES: If the user is logged in...
	if (!error && data?.claims) {
		const userId = data.claims.sub;

		const { preferences, error: prefError } = await getUserPreferences(userId);
		if (prefError) console.error(prefError);

		// If the user is already logged and has its account created, go to app
		if (preferences?.onboarding_status === 'finished') redirect(303, '/recipes');
		// Logged in but no data yet, make the user setup their account
		else if (!url.pathname.startsWith('/welcome')) redirect(303, '/welcome');
	} else {
		// Not logged in, redirect to login if on /welcome
		if (url.pathname.startsWith('/welcome')) redirect(303, '/login');
	}

	return { url: url.origin, claims: data?.claims };
};
