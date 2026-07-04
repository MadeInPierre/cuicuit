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
		console.log('Server check at /(app):', url.pathname, data.claims, preferences);

		// Logged in but doesn't have user data, onboard them
		if (preferences?.onboarding_status !== 'finished') {
			redirect(303, '/welcome');
		}
	}

	// Not logged in at /(app), redirect to /login
	else {
		console.log('At /recipes but not logged in, going to /login');
		redirect(303, '/login');
	}

	// Logged in and user data present, all good
	return { url: url.origin, claims: data?.claims };
};
