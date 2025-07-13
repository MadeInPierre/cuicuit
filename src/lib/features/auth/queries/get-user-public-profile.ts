import { supabase } from '$lib/shared/db/supabase-client';

export async function getUserPublicProfile(userId: string) {
	if (!supabase) throw new Error('Supabase client not available');
	if (!userId) throw new Error('User ID not provided');

	const { data: profile, error } = await supabase
		.from('user_public_profiles')
		.select('*')
		.eq('user_id', userId)
		.single();

	if (error) {
		console.error('Error fetching user public profile:', error);
	}

	return profile || null;
}

export type UserPublicProfile =
	ReturnType<typeof getUserPublicProfile> extends Promise<infer T> ? T : never;
