import { toast } from 'svelte-sonner';
import { updateUserAvatar } from './update-user-avatar';
import { supabase } from '$lib/shared/db/supabase-client';

/**
 * Remove the picture from the storage and update the userDoc avatar
 */
export async function deleteUserPicture(userId: string) {
	if (!userId) throw new Error('No user to delete the picture for');
	if (!supabase) throw new Error('Supabase client not available');

	// Delete the image from Supabase storage
	const { error: deleteError } = await supabase.storage
		.from('users')
		.remove([`public/${userId}/avatar.png`]);

	if (deleteError) {
		console.error('Error deleting avatar image:', deleteError);
		toast.error('Failed to delete profile picture. Please try again later.');
		throw deleteError;
	}

	// Update the user's profile row in the database
	await updateUserAvatar(userId, undefined, null);

	// Notify the user
	toast.success('Profile picture deleted.');
}
