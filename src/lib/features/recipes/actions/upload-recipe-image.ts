import { firestore, storage } from '$lib/shared/db/firebase-client';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { toast } from 'svelte-sonner';
import type { DBRecipeDoc, RecipeDoc } from '../db/recipe-doc';
import type { DocState } from '$lib/shared/db/doc-state.svelte';
import { doc, updateDoc } from 'firebase/firestore';

/**
 * Upload a new recipe image to the storage and add the image url to the recipeDoc urls list
 */
export async function uploadRecipeImage(
	recipeId: string,
	recipeDoc: RecipeDoc | null,
	file: File | Blob
) {
	if (!file) throw new Error('No file to upload');
	if (!recipeDoc) throw new Error('No recipe data, not loaded yet?');

	// Generate a random uuid for the image
	const uuid = crypto.randomUUID(); // Only available in modern browsers and localhost or https

	// Upload the file to the storage
	const imgRef = ref(storage, `recipes/${recipeId}/${uuid}.png`);

	uploadBytesResumable(imgRef, file)
		.then((snapshot) => {
			return getDownloadURL(imgRef);
		})
		.then((url) => {
			const docRef = doc(firestore, 'recipes', recipeId);

			updateDoc(docRef, {
				imageIds: [...(recipeDoc?.imageIds || []), uuid as string],
				imageUrls: [...(recipeDoc?.imageUrls || []), url as string]
			});
		})
		.catch((error) => {
			toast.error('Failed to upload 😢', { description: 'Please try again later.' });
			console.error('Failed to upload the file:', error);
		});
}

/**
 * Delete the recipe image from the storage and remove the image url from the recipeDoc urls list
 */
export async function deleteRecipeImage(
	recipeDocState: DocState<RecipeDoc, DBRecipeDoc>,
	position: number
) {
	if (!recipeDocState.data) throw new Error('No recipe data, not loaded yet?');
	if (position < 0 || position >= recipeDocState.data.imageIds.length) {
		throw new Error('Invalid image position to delete');
	}

	// Example url: https://firebasestorage.googleapis.com/v0/b/madeinpierre-cuicuit.appspot.com/o/recipes%2Fx8GlJxkpILm91WflsPLz%2F42cbdf6b-7aec-4de9-a21b-e6f654379f57.png?alt=media&token=284a90cb-544c-4682-b179-f2621eade610
	// Take the last part of the url without the query values and remove the "recipes/" and ".png" parts
	const imageUuid = recipeDocState.data.imageIds[position];

	// Delete the file from the storage
	const imgRef = ref(storage, `recipes/${recipeDocState.id}/${imageUuid}.png`);
	await deleteObject(imgRef);

	// Remove the image from the recipeDoc
	await recipeDocState.setDoc({
		...recipeDocState.data,
		imageIds: recipeDocState.data.imageIds.filter((_, i) => i !== position),
		imageUrls: recipeDocState.data.imageUrls.filter((_, i) => i !== position)
	});
}
