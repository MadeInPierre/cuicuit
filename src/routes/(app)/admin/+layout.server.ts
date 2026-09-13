import { getUserPermissions } from '$lib/features/auth/queries/get-user-permissions';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { supabase } }) => {
	const { data, error } = await supabase.auth.getClaims();

	// Not logged in at /admin, redirect to /login
	if (error || !data?.claims) {
		redirect(303, '/login');
	}

	// Logged in but not an admin, back to the main app
	const { permissions } = await getUserPermissions(supabase, data.claims.sub);
	if (permissions?.role !== 'admin') {
		redirect(303, '/recipes');
	}

	return {};
};
