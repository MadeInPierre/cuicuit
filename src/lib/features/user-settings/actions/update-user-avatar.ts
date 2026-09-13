import { getClientCtx, runOp } from '$lib/core/operations/client.js';
import '$lib/core/operations/profile/update-avatar.js';
import type { ProfileUpdateAvatarInput } from '$lib/core/operations/profile/update-avatar.js';

/**
 * Thin client adapter over the `profile.update-avatar` op (M2 core migration).
 * Same name and signature — `AvatarForm` unchanged.
 *
 * Update the user's avatar in the Supabase database.
 * @param userId - The ID of the user whose avatar is being updated.
 * @param iconName - The name of the icon to set as the avatar. If undefined, the icon will not be changed.
 * @param imgUrl - The URL of the image to set as the avatar. If null, the image will be deleted.
 * @returns A promise that resolves when the avatar is updated.
 */
export async function updateUserAvatar(
	userId: string,
	iconName: string | undefined = undefined,
	imgUrl: string | null = null
): Promise<void> {
	await runOp<ProfileUpdateAvatarInput, void>('profile.update-avatar', await getClientCtx(), {
		userId,
		iconName,
		imageUrl: imgUrl
	});
}
