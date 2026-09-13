import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';
import { removeAvatarFile, updateAvatarRow } from './avatar-helpers.js';

export const profileUpdateAvatarInput = z.object({
	userId: z.string(),
	iconName: z.string().optional(),
	imageUrl: z.string().nullable().optional()
});

export type ProfileUpdateAvatarInput = z.infer<typeof profileUpdateAvatarInput>;

async function profileUpdateAvatarHandler(
	ctx: OpCtx,
	input: ProfileUpdateAvatarInput
): Promise<void> {
	const { userId, iconName, imageUrl } = input;
	if (!userId) throw new OpError('VALIDATION', 'No user to upload the file for');

	// If imageUrl is null, we are deleting the image from storage
	if (imageUrl === null) {
		await removeAvatarFile(ctx, userId);
	}

	// Update the user's avatar in the database
	await updateAvatarRow(ctx, userId, { icon: iconName, imageUrl });
}

/**
 * `profile.update-avatar` — set the avatar icon and/or image URL.
 *
 * Body moved verbatim from
 * `features/user-settings/actions/update-user-avatar.ts:updateUserAvatar`
 * (M2 core migration; behavior unchanged — passing `imageUrl: null` deletes the
 * storage file, which is also what the icon picker relies on).
 */
export const profileUpdateAvatarOp = defineOp({
	name: 'profile.update-avatar',
	domain: 'profile',
	kind: 'write',
	sync: 'later',
	input: profileUpdateAvatarInput,
	handler: profileUpdateAvatarHandler
});
