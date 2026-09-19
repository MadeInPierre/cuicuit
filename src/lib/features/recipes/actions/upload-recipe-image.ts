import { getClientCtx, runOp } from '$lib/core/operations/client.js';
import type { DeleteRecipeImageInput } from '$lib/core/operations/recipes/delete-image.js';
import type { UploadRecipeImageInput } from '$lib/core/operations/recipes/upload-image.js';
import { toast } from 'svelte-sonner';

/**
 * M2: thin client wrappers over the `recipes.upload-image` /
 * `recipes.delete-image` core ops (toast stays here).
 */

export async function uploadRecipeImage(
	file: File,
	recipeId: string,
	currentImageIds: string[] | null
) {
	if (!file) throw new Error('No file to upload');

	try {
		const imageId = await runOp<UploadRecipeImageInput, string>(
			'recipes.upload-image',
			await getClientCtx(),
			{ file, recipeId, currentImageIds }
		);
		toast.success('Image uploaded successfully.');
		return imageId;
	} catch (error) {
		console.error('Error uploading image:', error);
		toast.error('Failed to upload image.', { description: 'Please try again later.' });
		return;
	}
}

/**
 * Delete the recipe image from the storage and remove the image url from the recipeDoc urls list
 */
export async function deleteRecipeImage(
	imgId: string,
	recipeId: string,
	currentImageIds: string[]
) {
	try {
		const updatedImageIds = await runOp<DeleteRecipeImageInput, string[]>(
			'recipes.delete-image',
			await getClientCtx(),
			{ imageId: imgId, recipeId, currentImageIds }
		);
		toast.success('Image deleted successfully.');
		return updatedImageIds;
	} catch (error) {
		console.error('Error updating recipe after image deletion:', error);
		toast.error('Failed to update recipe after image deletion.');
		return;
	}
}
