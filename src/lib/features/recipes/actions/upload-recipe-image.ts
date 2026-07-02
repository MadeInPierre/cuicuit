import { supabase } from '$lib/shared/db/supabase-client.svelte';
import { toast } from 'svelte-sonner';

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
 * Upload a new recipe image to the storage and add the image url to the recipeDoc urls list
 */
export async function uploadRecipeImage(
	file: File,
	recipeId: string,
	currentImageIds: string[] | null
) {
	if(!supabase.client) throw new Error("No supabase client");
	if (!file) throw new Error('No file to upload');

	// Get the file extension
	const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
	const uuid = generateUuid();
	const imageId = `${uuid}.${ext}`;

	// Upload the image to Supabase storage
	const { data, error } = await supabase.client.storage
		.from('recipes')
		.upload(`images/${recipeId}/${imageId}`, file, {
			contentType: file.type,
			upsert: true
		});

	if (error) {
		console.error('Error uploading image:', error);
		toast.error('Failed to upload image.');
		return;
	}

	toast.success('Image uploaded successfully.');

	// Update the recipe row in supabase with the new image ID
	const { error: updateError } = await supabase.client
		.from('recipes')
		.update({ image_ids: [...(currentImageIds || []), imageId] })
		.eq('id', recipeId);

	if (updateError) {
		console.error('Error updating recipe with new image ID:', updateError);
		toast.error('Failed to update recipe with new image ID.');
		return;
	}

	console.log('Recipe updated with new image ID.');
	return imageId;
}

/**
 * Delete the recipe image from the storage and remove the image url from the recipeDoc urls list
 */
export async function deleteRecipeImage(
	imgId: string,
	recipeId: string,
	currentImageIds: string[]
) {
	if(!supabase.client) throw new Error("No supabase client");

	// Delete the image from Supabase storage
	await supabase.client.storage.from('recipes').remove([`images/${recipeId}/${imgId}`]);

	// Remove the image ID from the recipe's image_ids array
	const updatedImageIds = currentImageIds.filter((id) => id !== imgId);
	const { error } = await supabase.client
		.from('recipes')
		.update({ image_ids: updatedImageIds })
		.eq('id', recipeId);

	if (error) {
		console.error('Error updating recipe after image deletion:', error);
		toast.error('Failed to update recipe after image deletion.');
		return;
	}

	toast.success('Image deleted successfully.');
	return updatedImageIds;
}
