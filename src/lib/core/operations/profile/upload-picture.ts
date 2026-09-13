import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';
import { removeAvatarFile, updateAvatarRow } from './avatar-helpers.js';

const MAX_PICTURE_BYTES = 5 * 1024 * 1024;

export const profileUploadPictureInput = z.object({
	userId: z.string(),
	file: z.custom<File>((v) => typeof File !== 'undefined' && v instanceof File, {
		message: 'No file to upload'
	})
});

export type ProfileUploadPictureInput = z.infer<typeof profileUploadPictureInput>;

async function profileUploadPictureHandler(
	ctx: OpCtx,
	input: ProfileUploadPictureInput
): Promise<string> {
	const { userId, file } = input;
	if (!userId) throw new OpError('VALIDATION', 'No user to upload the file for');
	if (!(file instanceof File)) throw new OpError('VALIDATION', 'No file to upload');

	// Validate file type
	if (!file.type.startsWith('image/')) {
		throw new OpError('VALIDATION', 'Invalid file type');
	}

	// Validate file size (e.g., max 5MB)
	if (file.size > MAX_PICTURE_BYTES) {
		throw new OpError('VALIDATION', 'File size exceeds limit');
	}

	// Avatar path is fixed per user, so overwrite by removing first.
	await removeAvatarFile(ctx, userId);

	// Upload the file to Supabase storage
	const { error } = await ctx.supabase.storage
		.from('users')
		.upload(`public/${userId}/avatar.png`, file, {
			contentType: file.type
		});

	if (error) {
		throw new OpError('INTERNAL', 'File upload failed', error);
	}

	// Get the public URL of the uploaded file
	const { data: publicURL } = ctx.supabase.storage
		.from('users')
		.getPublicUrl(`public/${userId}/avatar.png`);

	if (!publicURL) {
		throw new OpError('INTERNAL', 'Public URL retrieval failed');
	}

	// Update the user's profile row in the database
	await updateAvatarRow(ctx, userId, { imageUrl: publicURL.publicUrl });

	// Return the public URL of the uploaded image
	return publicURL.publicUrl;
}

/**
 * `profile.upload-picture` — upload the avatar file + point the profile at it.
 *
 * Body moved verbatim from
 * `features/user-settings/actions/upload-profile-picture.ts:uploadProfilePicture`
 * (M2 core migration). Validation messages are preserved; the failure toasts stay
 * in the thin adapter because `AvatarForm` relies on them.
 */
export const profileUploadPictureOp = defineOp({
	name: 'profile.upload-picture',
	domain: 'profile',
	kind: 'storage',
	sync: 'later',
	input: profileUploadPictureInput,
	handler: profileUploadPictureHandler
});
