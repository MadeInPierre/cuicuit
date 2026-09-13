import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';

export const spacesJoinInput = z.object({
	userId: z.string(),
	spaceId: z.string(),
	theme: z.string()
});

export type SpacesJoinInput = z.infer<typeof spacesJoinInput>;

async function spacesJoinHandler(ctx: OpCtx, input: SpacesJoinInput): Promise<void> {
	const { userId, spaceId, theme } = input;
	if (!userId) throw new OpError('VALIDATION', 'User ID not provided');
	if (!spaceId) throw new OpError('VALIDATION', 'Space ID not provided');
	if (!theme) throw new OpError('VALIDATION', 'Theme not provided');

	// Check if the space exists and get its row. The `spaces` SELECT policy is
	// membership-gated, so a joining non-member cannot read the row through
	// `ctx.supabase`.
	const { data, error: fetchError } = await (ctx.admin ?? ctx.supabase)
		.from('spaces')
		.select('id, name, icon')
		.eq('id', spaceId)
		.single();

	if (fetchError || !data) throw new OpError('NOT_FOUND', 'space-not-found', fetchError);

	// Add the space id and theme to the user's space_members
	const { error: memberError } = await ctx.supabase.from('space_members').insert([
		{
			space_id: spaceId,
			user_id: userId,
			theme
		}
	]);
	if (memberError) throw new OpError('CONFLICT', 'already-joined-space', memberError);
}

/**
 * `spaces.join` — add the user to a space's members.
 *
 * Body moved verbatim from `features/spaces/actions/join-space.ts:joinSpace`
 * (M2 core migration; behavior unchanged — `space-not-found` / `already-joined-space`
 * messages are preserved because `JoinSpaceForm` matches on them).
 */
export const spacesJoinOp = defineOp({
	name: 'spaces.join',
	domain: 'spaces',
	kind: 'write',
	sync: 'later',
	docs: { title: 'Join space', description: 'Adds the user to a space members list.' },
	input: spacesJoinInput,
	handler: spacesJoinHandler
});
