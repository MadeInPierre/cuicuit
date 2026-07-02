import { supabase } from '$lib/shared/db/supabase-client.svelte';
import { toast } from 'svelte-sonner';
import { updateUserAvatar } from './update-user-avatar';

/**
 * Remove the picture from the storage and update the userDoc avatar
 */
export async function deleteUserPicture(userId: string) {
	if(!supabase.client) throw new Error("No supabase client"); 
	if (!userId) throw new Error('No user to delete the picture for');

	// Delete the image from Supabase storage
	const { error: deleteError } = await supabase.client.storage
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
