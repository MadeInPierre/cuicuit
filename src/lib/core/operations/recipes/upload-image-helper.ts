import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '$lib/shared/db/supabase.types';

function generateUuid() {
	const c = globalThis.crypto;
	if (c && typeof c.randomUUID === 'function') {
		return c.randomUUID();
	}

	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
		const r = (Math.random() * 16) | 0;
		const v = char === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/**
 * Upload a new recipe image to storage and append its id to the recipe's
 * `image_ids`. Moved from `features/recipes/actions/upload-recipe-image.ts`
 * (toast-free: throws instead of returning `undefined`).
 * Co-located helper shared by the `recipes.upload-image` op and the import pipeline.
 */
export async function uploadImageToRecipe(
	client: SupabaseClient<Database>,
	file: File,
	recipeId: string,
	currentImageIds: string[] | null
): Promise<string> {
	if (!file) throw new Error('No file to upload');

	// Get the file extension
	const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
	const uuid = generateUuid();
	const imageId = `${uuid}.${ext}`;

	// Upload the image to Supabase storage
	const { error } = await client.storage
		.from('recipes')
		.upload(`images/${recipeId}/${imageId}`, file, {
			contentType: file.type,
			upsert: true
		});

	if (error) {
		throw new Error(`Failed to upload image: ${error.message}`);
	}

	// Update the recipe row in supabase with the new image ID
	const { error: updateError } = await client
		.from('recipes')
		.update({ image_ids: [...(currentImageIds || []), imageId] })
		.eq('id', recipeId);

	if (updateError) {
		throw new Error(`Failed to update recipe with new image ID: ${updateError.message}`);
	}

	return imageId;
}

/**
 * Delete a recipe image from storage and remove its id from the recipe's
 * `image_ids`. Moved from `features/recipes/actions/upload-recipe-image.ts`
 * (toast-free: throws instead of returning `undefined`).
 */
export async function deleteImageFromRecipe(
	client: SupabaseClient<Database>,
	imgId: string,
	recipeId: string,
	currentImageIds: string[]
): Promise<string[]> {
	// Delete the image from Supabase storage
	await client.storage.from('recipes').remove([`images/${recipeId}/${imgId}`]);

	// Remove the image ID from the recipe's image_ids array
	const updatedImageIds = currentImageIds.filter((id) => id !== imgId);
	const { error } = await client
		.from('recipes')
		.update({ image_ids: updatedImageIds })
		.eq('id', recipeId);

	if (error) {
		throw new Error(`Failed to update recipe after image deletion: ${error.message}`);
	}

	return updatedImageIds;
}
