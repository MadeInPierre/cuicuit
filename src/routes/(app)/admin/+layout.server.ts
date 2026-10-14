import { isTransportError } from '$lib/features/auth/offline-error';
import { getUserPermissions } from '$lib/features/auth/queries/get-user-permissions';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { supabase } }) => {
	const { data, error } = await supabase.auth.getClaims();

	// Supabase unreachable: not a signed-out user — let them through so the
	// client renders degraded states instead of bouncing to /login.
	if (error && isTransportError(error)) return {};

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
