import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp } from '../registry.js';

export const deleteRecipeInput = z.object({
	recipeId: z.string().min(1),
	/** True restores a soft-deleted recipe (`deleted_at` back to null). */
	restore: z.boolean().default(false)
});

export type DeleteRecipeInput = z.infer<typeof deleteRecipeInput>;

/**
 * Soft-deletes (or restores) a recipe.
 * Moved from `features/recipes/actions/delete-recipe.ts`
 * (toast + undo action stay in the thin client wrapper).
 */
export const deleteRecipeOp = defineOp({
	name: 'recipes.delete',
	domain: 'recipes',
	kind: 'write',
	sync: 'synced',
	input: deleteRecipeInput,
	handler: async (ctx, { recipeId, restore }) => {
		const now = new Date().toISOString();

		// Soft delete the recipe
		const { error } = await ctx.supabase
			.from('recipes')
			.update({ deleted_at: restore ? null : now })
			.eq('id', recipeId);

		// TODO Soft delete the attached meals

		// TODO Soft delete shopping items attached to the meals

		if (error) {
			throw new OpError('INTERNAL', 'Failed to delete recipe.', error);
		}

		return true;
	}
});
