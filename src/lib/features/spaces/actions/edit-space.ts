import { supabase } from '$lib/shared/db/supabase-client';
import type { SpaceIconKey, SpaceThemeKey } from '../consts';

export async function editSpace(
	userId: string,
	spaceId: string,
	name: string,
	theme: SpaceThemeKey,
	icon: SpaceIconKey
) {
	if (!supabase) throw new Error('Supabase client not available');
	if (!userId) throw new Error('User ID not provided');
	if (!spaceId) throw new Error('Space ID not provided');
	if (!name || !theme || !icon) throw new Error('Missing required parameters');

	// Forbid to user a name already in use by another space owned by the user
	const { data: userSpaces, error: fetchError } = await supabase
		.from('spaces')
		.select('id, name')
		.eq('author_id', userId);
	if (fetchError) throw fetchError;

	const hasSpaceWithSameName = userSpaces.some(
		(space) => space.name === name && space.id !== spaceId
	);
	if (hasSpaceWithSameName) throw new Error('space-already-exists');

	// Update the space's name & icon in the spaces table
	const { error: updateError } = await supabase
		.from('spaces')
		.update({ name, icon })
		.eq('id', spaceId);
	if (updateError) throw updateError;

	// Update the user's theme in the space_members table
	const { error: memberError } = await supabase
		.from('space_members')
		.update({ theme })
		.eq('space_id', spaceId)
		.eq('user_id', userId);
	if (memberError) throw memberError;
}
