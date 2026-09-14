import { z } from 'zod';

import { DEFAULT_LANGUAGE, languageCodeSchema } from '$lib/shared/language.js';

import { OpError } from '../errors.js';
import { resolveLanguageId } from '../languages/resolve.js';
import { defineOp, type OpCtx } from '../registry.js';

export const spacesCreateInput = z.object({
	userId: z.string(),
	name: z.string(),
	theme: z.string(),
	icon: z.string(),
	lang: languageCodeSchema.default(DEFAULT_LANGUAGE)
});

export type SpacesCreateInput = z.infer<typeof spacesCreateInput>;

async function spacesCreateHandler(ctx: OpCtx, input: SpacesCreateInput): Promise<string> {
	const { userId, name, theme, icon, lang } = input;
	if (!userId) throw new OpError('VALIDATION', 'User ID not provided');
	if (!name || !theme || !icon) throw new OpError('VALIDATION', 'Missing required parameters');
	const { id: languageId } = await resolveLanguageId(ctx.supabase, lang);

	// Check if the user already has a space with the same name
	const { data: existingSpaces, error: fetchError } = await ctx.supabase
		.from('space_members')
		.select('space_id, spaces(name)')
		.eq('user_id', userId);

	if (fetchError) throw new OpError('INTERNAL', 'Failed to create space.', fetchError);
	if (existingSpaces && existingSpaces.some((sm) => sm.spaces?.name === name)) {
		throw new OpError('CONFLICT', 'space-already-exists');
	}

	// The id is generated here (not `.select()`-ed back): the `spaces` SELECT
	// policy is membership-gated, so reading the row back in the same statement
	// fails RLS before the membership below exists.
	const spaceId = crypto.randomUUID();
	const { error: spaceError } = await ctx.supabase.from('spaces').insert([
		{
			id: spaceId,
			name,
			icon,
			initial_theme: theme,
			author_id: userId,
			language_id: languageId
		}
	]);
	if (spaceError) throw new OpError('INTERNAL', 'Failed to create space.', spaceError);

	// Insert into space_members table
	const { error: memberError } = await ctx.supabase.from('space_members').insert([
		{
			space_id: spaceId,
			user_id: userId,
			theme
		}
	]);
	if (memberError) throw new OpError('INTERNAL', 'Failed to create space.', memberError);

	return spaceId;
}

/**
 * `spaces.create` — create a space + its author membership.
 *
 * Body moved verbatim from `features/spaces/actions/create-space.ts:createSpace`
 * (M2 core migration; behavior and return shape unchanged — the `space-already-exists`
 * message is preserved because `CreateSpaceForm` matches on it).
 */
export const spacesCreateOp = defineOp({
	name: 'spaces.create',
	domain: 'spaces',
	kind: 'write',
	sync: 'later',
	docs: {
		title: 'Create space',
		description: 'Creates a new space plus its author membership and returns the space id.'
	},
	input: spacesCreateInput,
	handler: spacesCreateHandler
});
