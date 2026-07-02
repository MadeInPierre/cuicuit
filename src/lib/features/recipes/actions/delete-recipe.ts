import { supabase } from '$lib/shared/db/supabase-client.svelte';
import { toast } from 'svelte-sonner';

/**
 * Deletes a recipe document in the recipes collection
 * @returns a boolean indicating success or failure
 */
export async function deleteRecipe(
	recipeId: string,
	options?: { undo?: boolean; toastId?: string | number }
) {
	if(!supabase.client) throw new Error("No supabase client");
	if (!recipeId) {
		throw new Error('No recipe to delete');
	}

	const now = new Date().toISOString();

	// Soft delete the recipe
	const { error } = await supabase.client
		.from('recipes')
		.update({ deleted_at: options?.undo ? null : now })
		.eq('id', recipeId);

	// TODO Soft delete the attached meals

	// TODO Soft delete shopping items attached to the meals

	if (error) {
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
