import { supabase } from '$lib/shared/db/supabase-client';
import type { SpaceIconKey, SpaceThemeKey } from '../consts';

/** * Creates a new space for the user.
 * @param userId - The ID of the user creating the space.
 * @param name - The name of the space.
 * @param theme - The theme key for the space.
 * @param icon - The icon key for the space.
 * @returns The ID of the created space.
 */
export async function createSpace(
	userId: string,
	name: string,
	theme: SpaceThemeKey,
	icon: SpaceIconKey
) {
	if (!supabase) throw new Error('Supabase client not available');
	if (!userId) throw new Error('User ID not provided');
	if (!name || !theme || !icon) throw new Error('Missing required parameters');

	// Check if the user already has a space with the same name
	const { data: existingSpaces, error: fetchError } = await supabase
		.from('space_members')
		.select('space_id, spaces(name)')
		.eq('user_id', userId);

	if (fetchError) throw fetchError;
	if (existingSpaces && existingSpaces.some((sm) => sm.spaces?.name === name)) {
		throw new Error('space-already-exists');
	}

	// Insert into spaces table
	const { data: spaceInsert, error: spaceError } = await supabase
		.from('spaces')
		.insert([
			{
				name,
				icon,
				initial_theme: theme,
				author_id: userId
				// TODO add language preference?
			}
		])
		.select('id')
		.single();
	if (spaceError) throw spaceError;
	const spaceId = spaceInsert?.id;
	if (!spaceId) throw new Error('Failed to create space');

	// Insert into space_members table
	const { error: memberError } = await supabase.from('space_members').insert([
		{
			space_id: spaceId,
			user_id: userId,
			theme
		}
	]);
	if (memberError) throw memberError;

	console.log(`Space created with ID: ${spaceId} for user: ${userId}`);
	return spaceId;
}
