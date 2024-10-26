import { storage } from '$lib/shared/db/firebase-client';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { toast } from 'svelte-sonner';
import { updateUserDocAvatar } from './update-user-doc-avatar';
import { UserDocState } from '$lib/features/auth/state/user-doc-state.svelte';

/**
 * Upload the profile picture to the storage and update the userDoc avatar
 */
export function uploadProfilePicture(userDocState: UserDocState, file: File) {
	if (!file) throw new Error('No file to upload');
	if (!userDocState.user) throw new Error('No user to upload the file for');

	// Upload the file to the storage
	const imgRef = ref(storage, `users/${userDocState.user.uid}/profile.png`);

	uploadBytesResumable(imgRef, file)
		.then((snapshot) => {
			return getDownloadURL(imgRef);
		})
		.then((url) => {
			updateUserDocAvatar(userDocState, 'image', null, url as string);
		})
		.catch((error) => {
			toast.error('Failed to upload 😢', { description: 'Please try again later.' });
			console.error('Failed to upload the file:', error);
		});
}
