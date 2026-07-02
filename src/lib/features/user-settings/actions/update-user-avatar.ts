import { supabase } from '$lib/shared/db/supabase-client.svelte';

/**
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
) {
	if(!supabase.client) throw new Error("No supabase client");
	if (!userId) throw new Error('No user to upload the file for');
	console.log('Updating user avatar:', iconName, imgUrl);

	// If imgUrl is null, we are delete the image from storage
	if (imgUrl === null) {
		// Delete the image from Supabase storage
		const { error: deleteError } = await supabase.client.storage
			.from('users')
			.remove([`public/${userId}/avatar.png`]);

		if (deleteError) {
			console.error('Error deleting avatar image:', deleteError);
			throw deleteError;
		}
	}

	// Update the user's avatar in the Supabase database
	const { error } = await supabase.client
		.from('user_public_profiles')
		.update({
			...(iconName ? { icon: iconName } : {}), // Always have an icon, even if it's the same
			image_url: imgUrl
		})
		.eq('user_id', userId);

	if (error) {
		console.error('Error updating user avatar:', error);
		throw error;
	}
}
