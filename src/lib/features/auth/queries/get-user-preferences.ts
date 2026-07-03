import { supabase } from '$lib/shared/db/supabase-client.svelte';

export async function getUserPreferences(userId: string) {
	if (!supabase.client) return { preferences: null, error: null };
	if (!userId) throw new Error('User ID not provided');

	const { data: preferences, error } = await supabase.client
		.from('user_preferences')
		.select('*')
		.eq('user_id', userId)
		.single();

	if (error) {
		// No results
		if (error?.code === 'PGRST116') return { preferences: null, error: null };

		console.error('Error fetching user preferences:', error);
	}

	return { preferences: preferences || null, error };
}

type UserPreferencesReturn =
	ReturnType<typeof getUserPreferences> extends Promise<infer T> ? T : never;
export type UserPreferences = UserPreferencesReturn['preferences'];
