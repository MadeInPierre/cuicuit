import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '$lib/shared/db/supabase.types';

import { recipeImagePath, recipeThumbnailPath } from './image-shared.js';

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
 * Long-lived, immutable browser/CDN caching: image files are
 * content-addressed (uuid names), so they stay valid forever.
 */
const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable';

/**
 * Upload a new recipe image to storage and append its id to the recipe's
 * `image_ids`. Moved from `features/recipes/actions/upload-recipe-image.ts`
 * (toast-free: throws instead of returning `undefined`).
 * Co-located helper shared by the `recipes.upload-image` op and the import pipeline.
 *
 * When `thumbnail` is provided (480px WebP, resized by the caller — canvas
 * in the browser, `sharp` on the server), it is uploaded alongside the
 * original under the `-thumbnail.webp` convention (see `image-shared.ts`).
 * A failed thumbnail upload never fails the whole upload: components fall
 * back to the full image.
 */
export async function uploadImageToRecipe(
	client: SupabaseClient<Database>,
	file: File | Blob,
	recipeId: string,
	currentImageIds: string[] | null,
	thumbnail?: Blob | Uint8Array | null
): Promise<string> {
	if (!file) throw new Error('No file to upload');

	// Get the file extension
	const name = file instanceof File ? file.name : 'image.jpg';
	const ext = name.split('.').pop()?.toLowerCase() || 'jpg';
	const uuid = generateUuid();
	const imageId = `${uuid}.${ext}`;

	// Upload the image to Supabase storage
	const { error } = await client.storage
		.from('recipes')
		.upload(recipeImagePath(recipeId, imageId), file, {
			contentType: file.type || 'image/jpeg',
			cacheControl: IMMUTABLE_CACHE_CONTROL
		});

	if (error) {
		throw new Error(`Failed to upload image: ${error.message}`);
	}

	if (thumbnail) {
		try {
			const bytes =
				thumbnail instanceof Uint8Array ? thumbnail : new Uint8Array(await thumbnail.arrayBuffer());
			const { error: thumbError } = await client.storage
				.from('recipes')
				.upload(recipeThumbnailPath(recipeId, imageId), bytes, {
					contentType: 'image/webp',
					cacheControl: IMMUTABLE_CACHE_CONTROL,
					upsert: true
				});
			if (thumbError) {
				console.warn('Failed to upload image thumbnail, skipping:', thumbError.message);
			}
		} catch (thumbException) {
			console.warn('Failed to upload image thumbnail, skipping:', thumbException);
		}
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
 *
 * Removes the thumbnail alongside the original (best-effort: legacy images
 * may not have one).
 */
export async function deleteImageFromRecipe(
	client: SupabaseClient<Database>,
	imgId: string,
	recipeId: string,
	currentImageIds: string[]
): Promise<string[]> {
	// Delete the image and its thumbnail from Supabase storage
	await client.storage
		.from('recipes')
		.remove([recipeImagePath(recipeId, imgId), recipeThumbnailPath(recipeId, imgId)]);

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
