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
		// console.log('Server check at /(auth):', url.pathname, data.claims, preferences);

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
	return { url: url.origin };
};
