import { getClientCtx, OpError, runOp } from '$lib/core/operations/client.js';
import '$lib/core/operations/profile/delete-picture.js';
import type { ProfileDeletePictureInput } from '$lib/core/operations/profile/delete-picture.js';
import { toast } from 'svelte-sonner';

/**
 * Thin client adapter over the `profile.delete-picture` op (M2 core migration).
 * Same name and signature — `AvatarForm` unchanged. Toasts preserved.
 *
 * Remove the picture from the storage and update the userDoc avatar
 */
export async function deleteUserPicture(userId: string): Promise<void> {
	if (!userId) throw new OpError('VALIDATION', 'No user to delete the picture for');

	try {
		await runOp<ProfileDeletePictureInput, void>('profile.delete-picture', await getClientCtx(), {
			userId
		});
	} catch (error) {
		console.error('Error deleting avatar image:', error);
		toast.error('Failed to delete profile picture. Please try again later.');
		throw error;
	}

	// Notify the user
	toast.success('Profile picture deleted.');
}
