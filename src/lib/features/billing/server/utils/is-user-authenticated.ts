import type { SupabaseClient } from '@supabase/supabase-js';

export async function serverIsUserAuthenticated(supabase: SupabaseClient) {
	if (!supabase.auth) throw new Error('No supabase client');

	const { data: userData, error: userError } = await supabase.auth.getUser();

	if (userError || userData.user?.role !== 'authenticated') {
		throw new Error('Not authenticated or Unauthorized');
	}

	const { id: userId, email, confirmed_at, is_anonymous } = userData.user;

	if (is_anonymous || !email || !confirmed_at) {
		throw new Error('User must be confirmed with a valid email.');
	}

	return { userId, email, isValid: true };
}
