import { supabase } from '$lib/shared/db/supabase-client.svelte';
import type { PostgrestError } from '@supabase/supabase-js';

export async function getUserPublicProfile(userId: string) {
	if (!supabase.client) throw new Error('Supabase client not available');
	if (!userId) throw new Error('User ID not provided');

	const { data: profile, error } = await supabase.client
		.from('user_public_profiles')
		.select('*')
		.eq('user_id', userId)
		.single();

	if (error) {
		if (error?.code === 'PGRST116') return { profile: null, error: null };

		console.error('Error fetching user public profile:', error);
	}

	return { profile, error };
}

type UserPublicProfileResponse =
	ReturnType<typeof getUserPublicProfile> extends Promise<infer T> ? T : never;
export type UserPublicProfile = UserPublicProfileResponse['profile'];

export async function getUserPublicProfiles(
	userIds: string[]
): Promise<{ profiles: UserPublicProfile[]; error: PostgrestError | null }> {
	if (!supabase.client) throw new Error('Supabase client not available');

	const { data, error } = await supabase.client
		.from('user_public_profiles')
		.select('*')
		.in('user_id', userIds); // Duplicates are fine

	if (error) {
		// No results
		if (error?.code === 'PGRST116') return { profiles: [], error: null };

		console.error('Error fetching member profiles:', error);
		throw error;
	}

	return { profiles: data, error };
}
