import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp } from '../registry.js';
import { uploadImageToRecipe } from './upload-image-helper.js';

export const uploadRecipeImageInput = z.object({
	recipeId: z.string().min(1),
	currentImageIds: z.array(z.string()).nullable().default(null),
	file: z.custom<File>((value) => value instanceof File, {
		message: 'No file to upload.'
	})
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
	input: uploadRecipeImageInput,
	handler: async (ctx, { recipeId, currentImageIds, file }) => {
		try {
			return await uploadImageToRecipe(ctx.supabase, file, recipeId, currentImageIds);
		} catch (error) {
			throw new OpError('INTERNAL', 'Failed to upload image.', error);
		}
	}
});
