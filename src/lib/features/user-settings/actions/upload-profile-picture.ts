import { getClientCtx, OpError, runOp } from '$lib/core/operations/client.js';
import '$lib/core/operations/profile/upload-picture.js';
import type { ProfileUploadPictureInput } from '$lib/core/operations/profile/upload-picture.js';
import { toast } from 'svelte-sonner';

/**
 * Thin client adapter over the `profile.upload-picture` op (M2 core migration).
 * Same name, same signature, same return (public URL) — `AvatarForm` unchanged.
 * Boundary validation toasts preserved (the form does not toast itself).
 *
 * Upload the profile picture to the storage and update the userDoc avatar
 */
export async function uploadProfilePicture(userId: string, file: File): Promise<string> {
	if (!userId) throw new OpError('VALIDATION', 'No user to upload the file for');
	if (!file) throw new OpError('VALIDATION', 'No file to upload');

	// Validate file type
	if (!file.type.startsWith('image/')) {
		toast.error('Invalid file type. Please upload an image.');
		throw new OpError('VALIDATION', 'Invalid file type');
	}

	// Validate file size (e.g., max 5MB)
	if (file.size > 5 * 1024 * 1024) {
		toast.error('File size exceeds 5MB. Please upload a smaller image.');
		throw new OpError('VALIDATION', 'File size exceeds limit');
	}

	try {
		return await runOp<ProfileUploadPictureInput, string>(
			'profile.upload-picture',
			await getClientCtx(),
			{ userId, file }
		);
	} catch (error) {
		console.error('Error uploading profile picture:', error);
		if (error instanceof OpError && error.message === 'File upload failed') {
			toast.error('Failed to upload profile picture. Please try again later.');
		} else if (error instanceof OpError && error.message === 'Public URL retrieval failed') {
			toast.error('Failed to retrieve profile picture URL. Please try again later.');
		}
		throw error;
	}
}
