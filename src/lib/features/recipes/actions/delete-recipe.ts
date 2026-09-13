import { getClientCtx, runOp } from '$lib/core/operations/client.js';
import type { DeleteRecipeInput } from '$lib/core/operations/recipes/delete.js';
import { toast } from 'svelte-sonner';

/**
 * M2: thin client wrapper over the `recipes.delete` core op (toast + undo stay here).
 */
export async function deleteRecipe(
	recipeId: string,
	options?: { undo?: boolean; toastId?: string | number }
) {
	if (!recipeId) {
		throw new Error('No recipe to delete');
	}

	try {
		await runOp<DeleteRecipeInput, boolean>('recipes.delete', await getClientCtx(), {
			recipeId,
			restore: options?.undo ?? false
		});
	} catch (error) {
		console.error('Error deleting recipe:', error);
		toast.error('Failed to delete recipe.', {
			description: 'Please try again later.'
		});
		throw new Error('Failed to delete recipe');
	}

	if (options?.undo) {
		toast.success('Recipe restored', { description: 'We got it back!', id: options?.toastId });
	} else {
		const id = toast.success('Recipe deleted', {
			id: options?.toastId,
			description: 'It looked yummy though',
			action: {
				label: 'Undo',
				onClick: () => deleteRecipe(recipeId, { undo: true, toastId: id })
			}
		});
	}

	return true;
}
