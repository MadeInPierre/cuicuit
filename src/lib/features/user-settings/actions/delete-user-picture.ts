import { deleteObject, ref } from 'firebase/storage';
import { toast } from 'svelte-sonner';
import { updateUserDocAvatar } from './update-user-doc-avatar';
import { storage } from '$lib/shared/db/firebase-client';
import type { UserDocState } from '$lib/features/auth/state/user-doc-state.svelte';

/**
 * Remove the picture from the storage and update the userDoc avatar
 */
export function deleteUserPicture(userDocState: UserDocState, imgRef: string) {
	if (!imgRef) {
		toast.error('No photo set.', { description: "Can't delete what's not there!" });
		return;
	}

	const picRef = ref(storage!, imgRef);

	deleteObject(picRef)
		.then(() => {
			updateUserDocAvatar(userDocState, 'icon');
			toast.success('Photo deleted 🗑', { description: 'Out of our servers!' });
		})
		.catch((error) => {
			if (error.code == 'storage/object-not-found') {
				// Shouldn't happen, but just in case
				toast.error('No photo found.', { description: "Hmm, the photo doesn't exist anyway." });
				return;
			}
			throw new Error("Couldn't delete the file:", error.code);
		});
}
