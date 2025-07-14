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

export async function getUserPublicProfiles(userIds: string[]): Promise<UserPublicProfile[]> {
	const { data: memberProfiles, error: profilesError } = await supabase
		.from('user_public_profiles')
		.select('*')
		.in('user_id', userIds); // Duplicates are fine

	if (profilesError) {
		console.error('Error fetching member profiles:', profilesError);
		throw profilesError;
	}

	return memberProfiles;
}
