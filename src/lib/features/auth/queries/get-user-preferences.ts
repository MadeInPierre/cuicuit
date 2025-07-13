import { supabase } from '$lib/shared/db/supabase-client';

export async function getUserPreferences(userId: string) {
	if (!supabase) throw new Error('Supabase client not available');
	if (!userId) throw new Error('User ID not provided');

	const { data: preferences, error } = await supabase
		.from('user_preferences')
		.select('*')
		.eq('user_id', userId)
		.single();

	if (error) {
		console.error('Error fetching user preferences:', error);
	}

	return preferences || null;
}

export type UserPreferences =
	ReturnType<typeof getUserPreferences> extends Promise<infer T> ? T : never;
