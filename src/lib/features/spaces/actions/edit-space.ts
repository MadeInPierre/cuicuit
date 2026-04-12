import type { LanguageKey } from '$lib/features/user-settings/consts';
import { supabase } from '$lib/shared/db/supabase-client';
import type { SpaceIconKey, SpaceThemeKey } from '../consts';
import type { ActiveSpaceState } from '../state/active-space.svelte';

export async function editSpace(
	space: ActiveSpaceState,
	userId: string,
	name: string,
	theme: SpaceThemeKey,
	icon: SpaceIconKey,
	lang: LanguageKey
) {
	if (!supabase) throw new Error('Supabase client not available');
	if (!userId) throw new Error('User ID not provided');
	if (!space.activeSpace?.id) throw new Error('Space ID not provided');
	if (!name || !theme || !icon || !lang) throw new Error('Missing required parameters');

	// Fetch the language id corresponding to the provided language key
	const { data: languageData, error: languageError } = await supabase
		.from('languages')
		.select('id')
		.eq('lang', lang)
		.single();
	if (languageError) throw languageError;
	if (!languageData) throw new Error('Language not found');
	const languageId = languageData.id;

	// Forbid to user a name already in use by another space owned by the user
	const { data: userSpaces, error: fetchError } = await supabase
		.from('spaces')
		.select('id, name')
		.eq('author_id', userId);
	if (fetchError) throw fetchError;

	const hasSpaceWithSameName = userSpaces.some(
		(s) => s.name === name && s.id !== space.activeSpace?.id
	);
	if (hasSpaceWithSameName) throw new Error('space-already-exists');

	// Update the space's name & icon in the spaces table
	const { error: updateError } = await supabase
		.from('spaces')
		.update({ name, icon, language_id: languageId })
		.eq('id', space.activeSpace?.id);
	if (updateError) throw updateError;

	// Update the user's theme in the space_members table
	const { error: memberError } = await supabase
		.from('space_members')
		.update({ theme })
		.eq('space_id', space.activeSpace?.id)
		.eq('user_id', userId);
	if (memberError) throw memberError;

	// If everything is successful, refetch
	await space.refreshSpaces();
}
