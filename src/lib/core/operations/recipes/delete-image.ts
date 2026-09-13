import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp } from '../registry.js';
import { deleteImageFromRecipe } from './upload-image-helper.js';

export const deleteRecipeImageInput = z.object({
	recipeId: z.string().min(1),
	imageId: z.string().min(1),
	currentImageIds: z.array(z.string())
});

export type DeleteRecipeImageInput = z.infer<typeof deleteRecipeImageInput>;

/**
 * Deletes a recipe image from storage and removes its id from the recipe.
 * Moved from `features/recipes/actions/upload-recipe-image.ts:deleteRecipeImage`
 * (toast stays in the thin client wrapper).
 */
export const deleteRecipeImageOp = defineOp({
	name: 'recipes.delete-image',
	domain: 'recipes',
	kind: 'storage',
	sync: 'synced',
	docs: {
		title: 'Delete recipe image',
		description: 'Deletes a recipe image from storage and removes its id from the recipe.'
	},
	input: deleteRecipeImageInput,
	handler: async (ctx, { recipeId, imageId, currentImageIds }) => {
		try {
			return await deleteImageFromRecipe(ctx.supabase, imageId, recipeId, currentImageIds);
		} catch (error) {
			throw new OpError('INTERNAL', 'Failed to delete image.', error);
		}
	}
});
