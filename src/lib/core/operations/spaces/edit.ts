import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';

export const spacesEditInput = z.object({
	spaceId: z.string(),
	userId: z.string(),
	name: z.string(),
	theme: z.string(),
	icon: z.string(),
	// Language key (mirrors `languageKeys` in `features/user-settings/consts.ts`,
	// hardcoded here so core does not depend on feature modules).
	lang: z.string()
});

export type SpacesEditInput = z.infer<typeof spacesEditInput>;

async function spacesEditHandler(ctx: OpCtx, input: SpacesEditInput): Promise<void> {
	const { spaceId, userId, name, theme, icon, lang } = input;
	if (!userId) throw new OpError('VALIDATION', 'User ID not provided');
	if (!spaceId) throw new OpError('VALIDATION', 'Space ID not provided');
	if (!name || !theme || !icon || !lang)
		throw new OpError('VALIDATION', 'Missing required parameters');

	// Fetch the language id corresponding to the provided language key
	const { data: languageData, error: languageError } = await ctx.supabase
		.from('languages')
		.select('id')
		.eq('lang', lang)
		.single();
	if (languageError) {
		if (languageError.code === 'PGRST116')
			throw new OpError('NOT_FOUND', 'Language not found', languageError);
		throw new OpError('INTERNAL', 'Failed to edit space.', languageError);
	}
	if (!languageData) throw new OpError('NOT_FOUND', 'Language not found');
	const languageId = languageData.id;

	// Forbid to user a name already in use by another space owned by the user
	const { data: userSpaces, error: fetchError } = await ctx.supabase
		.from('spaces')
		.select('id, name')
		.eq('author_id', userId);
	if (fetchError) throw new OpError('INTERNAL', 'Failed to edit space.', fetchError);

	const hasSpaceWithSameName = userSpaces.some((s) => s.name === name && s.id !== spaceId);
	if (hasSpaceWithSameName) throw new OpError('CONFLICT', 'space-already-exists');

	// Update the space's name & icon in the spaces table
	const { error: updateError } = await ctx.supabase
		.from('spaces')
		.update({ name, icon, language_id: languageId })
		.eq('id', spaceId);
	if (updateError) throw new OpError('INTERNAL', 'Failed to edit space.', updateError);

	// Update the user's theme in the space_members table
	const { error: memberError } = await ctx.supabase
		.from('space_members')
		.update({ theme })
		.eq('space_id', spaceId)
		.eq('user_id', userId);
	if (memberError) throw new OpError('INTERNAL', 'Failed to edit space.', memberError);
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
	input: spacesEditInput,
	handler: spacesEditHandler
});
