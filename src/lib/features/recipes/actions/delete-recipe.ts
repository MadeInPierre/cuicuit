import { supabase } from '$lib/shared/db/supabase-client';
import { toast } from 'svelte-sonner';

/**
 * Deletes a recipe document in the recipes collection
 * @returns a boolean indicating success or failure
 */
export async function deleteRecipe(recipeId: string) {
	if (!recipeId) {
		throw new Error('No recipe to delete');
	}

	const { error } = await supabase.from('recipes').delete().eq('id', recipeId);

	if (error) {
		console.error('Error deleting recipe:', error);
		toast.error('Failed to delete recipe.', {
			description: 'Please try again later.'
		});
		throw new Error('Failed to delete recipe');
	}

	return true;
}
