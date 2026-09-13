import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';

export const spacesListInput = z.object({
	userId: z.string()
});

export type SpacesListInput = z.infer<typeof spacesListInput>;

async function spacesListHandler(ctx: OpCtx, input: SpacesListInput) {
	const { userId } = input;
	if (!userId) {
		throw new OpError('VALIDATION', 'User ID not provided');
	}

	const { data: userSpaces, error } = await ctx.supabase
		.from('space_members')
		.select(
			`
			...space_id(
				*,
				members:space_members(*),
				language:languages(*)
			)`
		)
		.eq('user_id', userId);

	if (error) {
		throw new OpError('INTERNAL', 'Failed to list spaces.', error);
	}
	if (!userSpaces) return [];
	return userSpaces;
}

export type SpacesListOutput = Awaited<ReturnType<typeof spacesListHandler>>;

/**
 * `spaces.list` — read the user's spaces with members + language.
 *
 * Body moved verbatim from
 * `features/spaces/queries/get-user-spaces-with-members.ts:getUserSpacesWithMembers`
 * (M2 core migration; behavior and return shape unchanged).
 */
export const spacesListOp = defineOp({
	name: 'spaces.list',
	domain: 'spaces',
	kind: 'read',
	sync: 'later',
	input: spacesListInput,
	handler: spacesListHandler
});
