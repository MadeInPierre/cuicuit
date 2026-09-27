import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp } from '../registry.js';
import { uploadImageToRecipe } from './upload-image-helper.js';

export const uploadRecipeImageInput = z.object({
	recipeId: z.string().min(1),
	currentImageIds: z.array(z.string()).nullable().default(null),
	file: z.custom<File | Blob>((value) => value instanceof File || value instanceof Blob, {
		message: 'No file to upload.'
	}),
	thumbnailFile: z
		.custom<File | Blob | Uint8Array>(
			(value) => value instanceof File || value instanceof Blob || value instanceof Uint8Array,
			{ message: 'Invalid thumbnail file.' }
		)
		.nullable()
		.default(null)
});

export type UploadRecipeImageInput = z.infer<typeof uploadRecipeImageInput>;

/**
 * Uploads a recipe image to storage and appends its id to the recipe.
 * Moved from `features/recipes/actions/upload-recipe-image.ts:uploadRecipeImage`
 * (toast stays in the thin client wrapper).
 */
export const uploadRecipeImageOp = defineOp({
	name: 'recipes.upload-image',
	domain: 'recipes',
	kind: 'storage',
	sync: 'synced',
	docs: {
		title: 'Upload recipe image',
		description: 'Uploads a recipe image to storage and appends its id to the recipe.',
		mcp: false
	},
	input: uploadRecipeImageInput,
	handler: async (ctx, { recipeId, currentImageIds, file, thumbnailFile }) => {
		try {
			return await uploadImageToRecipe(
				ctx.supabase,
				file,
				recipeId,
				currentImageIds,
				thumbnailFile
			);
		} catch (error) {
			throw new OpError('INTERNAL', 'Failed to upload image.', error);
		}
	}
});
