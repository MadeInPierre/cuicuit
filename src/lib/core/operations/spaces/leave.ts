import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';

export const spacesLeaveInput = z.object({
	userId: z.string(),
	spaceId: z.string()
});

export type SpacesLeaveInput = z.infer<typeof spacesLeaveInput>;

async function spacesLeaveHandler(ctx: OpCtx, input: SpacesLeaveInput): Promise<void> {
	const { userId, spaceId } = input;
	if (!userId) throw new OpError('VALIDATION', 'Error: User ID not provided');
	if (!spaceId) throw new OpError('VALIDATION', 'Error: Space ID not provided');

	// Check that the id is a valid space id
	const { data: space, error: fetchError } = await ctx.supabase
		.from('spaces')
		.select('id')
		.eq('id', spaceId)
		.single();
	if (fetchError) throw new OpError('INTERNAL', 'Failed to leave space.', fetchError);
	if (!space) throw new OpError('NOT_FOUND', 'space-not-found');

	// Check that this isn't the last space the user is a member of
	const { data: members, error: membersError } = await ctx.supabase
		.from('space_members')
		.select('space_id')
		.eq('user_id', userId);
	if (membersError) throw new OpError('INTERNAL', 'Failed to leave space.', membersError);
	if (members.length <= 1) {
		throw new OpError('CONFLICT', 'last-space-member');
	}
	if (!members.some((member) => member.space_id === spaceId)) {
		throw new OpError('FORBIDDEN', 'not-a-member');
	}

	// Remove the user from the space members
	const { error: memberError } = await ctx.supabase
		.from('space_members')
		.delete()
		.eq('user_id', userId)
		.eq('space_id', spaceId);
	if (memberError) throw new OpError('INTERNAL', 'Failed to leave space.', memberError);
}

/**
 * `spaces.leave` — remove the user from a space's members.
 *
 * Body moved verbatim from `features/spaces/actions/leave-space.ts:leaveSpace`
 * (M2 core migration; behavior unchanged — validation messages are preserved
 * verbatim, including the `Error: ` prefix).
 */
export const spacesLeaveOp = defineOp({
	name: 'spaces.leave',
	domain: 'spaces',
	kind: 'write',
	sync: 'later',
	docs: { title: 'Leave space', description: 'Removes the user from a space members list.' },
	input: spacesLeaveInput,
	handler: spacesLeaveHandler
});
