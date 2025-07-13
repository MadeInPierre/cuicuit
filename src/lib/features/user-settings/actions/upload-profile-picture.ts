import { toast } from 'svelte-sonner';
import { updateUserAvatar } from './update-user-avatar';
import { supabase } from '$lib/shared/db/supabase-client';

/**
 * Upload the profile picture to the storage and update the userDoc avatar
 */
export async function uploadProfilePicture(userId: string, file: File): Promise<string> {
	if (!file) throw new Error('No file to upload');
	if (!userId) throw new Error('No user to upload the file for');
	if (!supabase) throw new Error('Supabase client not available');

	// Validate file type
	if (!file.type.startsWith('image/')) {
		toast.error('Invalid file type. Please upload an image.');
		throw new Error('Invalid file type');
	}

	// Validate file size (e.g., max 5MB)
	if (file.size > 5 * 1024 * 1024) {
		toast.error('File size exceeds 5MB. Please upload a smaller image.');
		throw new Error('File size exceeds limit');
	}

	// Upload the file to Supabase storage
	const { data, error } = await supabase.storage
		.from('users')
		.upload(`public/${userId}/avatar.png`, file, {
			contentType: file.type,
			upsert: true // Overwrite if the file already exists
		});

	if (error) {
		console.error('Error uploading file:', error);
		toast.error('Failed to upload profile picture. Please try again later.');
		throw new Error('File upload failed');
	}

	// Get the public URL of the uploaded file
	const { data: publicURL } = await supabase.storage
		.from('users')
		.getPublicUrl(`public/${userId}/avatar.png`);

	if (!publicURL) {
		console.error('Error getting public URL');
		toast.error('Failed to retrieve profile picture URL. Please try again later.');
		throw new Error('Public URL retrieval failed');
	}

	// Update the user's profile row in the database
	await updateUserAvatar(userId, undefined, publicURL.publicUrl);

	// Return the public URL of the uploaded image
	return publicURL.publicUrl;
}
