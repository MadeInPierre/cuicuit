import { z } from 'zod';

import { languageCodeSchema } from '$lib/shared/language.js';

import { OpError } from '../errors.js';
import { resolveLanguageId } from '../languages/resolve.js';
import { defineOp, type OpCtx } from '../registry.js';

export const spacesEditInput = z.object({
	spaceId: z.string(),
	userId: z.string(),
	name: z.string(),
	theme: z.string(),
	icon: z.string(),
	lang: languageCodeSchema
});

export type SpacesEditInput = z.infer<typeof spacesEditInput>;

async function spacesEditHandler(ctx: OpCtx, input: SpacesEditInput): Promise<void> {
	const { spaceId, userId, name, theme, icon, lang } = input;
	if (!userId) throw new OpError('VALIDATION', 'User ID not provided');
	if (!spaceId) throw new OpError('VALIDATION', 'Space ID not provided');
	if (!name || !theme || !icon || !lang)
		throw new OpError('VALIDATION', 'Missing required parameters');

	// Resolve the public `lang` code to the internal `languages.id`
	const { id: languageId } = await resolveLanguageId(ctx.supabase, lang);

	// Forbid to user a name already in use by another space owned by the user
	const { data: userSpaces, error: fetchError } = await ctx.supabase
		.from('spaces')
		.select('id, name')
		.eq('author_id', userId);
	if (fetchError) throw new OpError('INTERNAL', 'Failed to edit space.', fetchError);

	const hasSpaceWithSameName = userSpaces.some((s) => s.name === name && s.id !== spaceId);
	if (hasSpaceWithSameName) throw new OpError('CONFLICT', 'space-already-exists');

	// Update the space's name & icon in the spaces table
	const { data: updatedSpaces, error: updateError } = await ctx.supabase
		.from('spaces')
		.update({ name, icon, language_id: languageId })
		.eq('id', spaceId)
		.select('id');
	if (updateError) throw new OpError('INTERNAL', 'Failed to edit space.', updateError);
	if (!updatedSpaces || updatedSpaces.length === 0)
		throw new OpError('NOT_FOUND', 'Space not found or not accessible.');

	// Update the user's theme in the space_members table
	const { data: updatedMembers, error: memberError } = await ctx.supabase
		.from('space_members')
		.update({ theme })
		.eq('space_id', spaceId)
		.select('space_id');
	if (memberError) throw new OpError('INTERNAL', 'Failed to edit space.', memberError);
	if (!updatedMembers || updatedMembers.length === 0)
		throw new OpError('NOT_FOUND', 'Space membership not found or not accessible.');
}

/**
 * `spaces.edit` — rename / re-icon / re-language a space + update the member theme.
 *
 * Body moved verbatim from `features/spaces/actions/edit-space.ts:editSpace`
 * (M2 core migration). The caller-side `space.refreshSpaces()` stays in the thin
 * adapter — core has no UI state. The `space-already-exists` message is preserved
 * because `EditSpaceForm` matches on it.
 */
export const spacesEditOp = defineOp({
	name: 'spaces.edit',
	domain: 'spaces',
	kind: 'write',
	sync: 'later',
	docs: {
		title: 'Edit space',
		description: 'Updates a space name, icon, language, and the member theme.'
	},
	input: spacesEditInput,
	handler: spacesEditHandler
});
