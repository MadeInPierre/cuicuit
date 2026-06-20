import { supabase } from '$lib/shared/db/supabase-client';
import type { SpaceThemeKey } from '../consts';

export async function joinSpace(userId: string, spaceId: string, theme: SpaceThemeKey) {
	if (!supabase) throw new Error('Supabase client not available');
	if (!userId) throw new Error('User ID not provided');
	if (!spaceId) throw new Error('Space ID not provided');
	if (!theme) throw new Error('Theme not provided');

	console.log('Joining space:', spaceId, theme);

	// Check if the space exists and get its row
	const { data, error: fetchError } = await supabase
		.from('spaces')
		.select('id, name, icon')
		.eq('id', spaceId)
		.single();

	if (fetchError || !data) throw new Error('space-not-found');

	// Add the space id and theme to the user's space_members
	const { error: memberError } = await supabase.from('space_members').insert([
		{
			space_id: spaceId,
			user_id: userId,
			theme
		}
	]);
	if (memberError) throw new Error('already-joined-space');
}
