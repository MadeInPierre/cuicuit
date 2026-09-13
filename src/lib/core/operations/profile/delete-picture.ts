import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';
import { removeAvatarFile, updateAvatarRow } from './avatar-helpers.js';

export const profileDeletePictureInput = z.object({
	userId: z.string()
});

export type ProfileDeletePictureInput = z.infer<typeof profileDeletePictureInput>;

async function profileDeletePictureHandler(
	ctx: OpCtx,
	input: ProfileDeletePictureInput
): Promise<void> {
	const { userId } = input;
	if (!userId) throw new OpError('VALIDATION', 'No user to delete the picture for');

	// Delete the image from Supabase storage
	await removeAvatarFile(ctx, userId);

	// Update the user's profile row in the database
	await updateAvatarRow(ctx, userId, { imageUrl: null });
}

/**
 * `profile.delete-picture` — remove the avatar file + clear the profile image URL.
 *
 * Body from `features/user-settings/actions/delete-user-picture.ts:deleteUserPicture`
 * (M2 core migration). The original called `updateUserAvatar(userId, undefined, null)`
 * after its own storage remove (deleting the file twice); this op performs a single
 * remove + row update with the same end state. The success toast stays in the thin
 * adapter because `AvatarForm` relies on it.
 */
export const profileDeletePictureOp = defineOp({
	name: 'profile.delete-picture',
	domain: 'profile',
	kind: 'storage',
	sync: 'later',
	docs: {
		title: 'Delete profile picture',
		description: 'Removes the user avatar file from storage and clears the profile image URL.'
	},
	input: profileDeletePictureInput,
	handler: profileDeletePictureHandler
});
