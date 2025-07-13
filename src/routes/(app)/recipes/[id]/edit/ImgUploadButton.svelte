<script lang="ts">
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_URL_CLOUD } from '$env/static/public';
	import { Input } from '$lib/shared/components/ui/input';
	import { supabase } from '$lib/shared/db/supabase-client';
	import { cn } from '$lib/utils';
	import { Camera, Loader2, Upload, X } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	type Props = {
		recipeId: string | null;
		currentImageIds: string[];
		size?: 'big' | 'small';
		position?: number;
		onImagesChanged?: (imageIds: string[]) => void;
	};

	let { recipeId, currentImageIds, position = 0, size = 'big', onImagesChanged }: Props = $props();

	let imgId: string | null = $derived.by(() => {
		if (!currentImageIds) return null;
		return currentImageIds[position];
	});
	let loading = $state(false);

	async function uploadImage(file: File) {
		if (!recipeId) return;

		loading = true;

		// Get the file extension
		const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
		const uuid = crypto.randomUUID();
		const imageId = `${uuid}.${ext}`;

		// Upload the image to Supabase storage
		const { data, error } = await supabase.storage
			.from('recipes')
			.upload(`images/${recipeId}/${imageId}`, file, {
				contentType: file.type,
				upsert: true
			});

		if (error) {
			console.error('Error uploading image:', error);
			toast.error('Failed to upload image.');
		} else {
			toast.success('Image uploaded successfully.');
		}

		// Update the recipe row in supabase with the new image ID
		const { error: updateError } = await supabase
			.from('recipes')
			.update({ image_ids: [...(currentImageIds || []), imageId] })
			.eq('id', recipeId);

		if (updateError) {
			console.error('Error updating recipe with new image ID:', updateError);
			toast.error('Failed to update recipe with new image ID.');
		} else {
			toast.success('Recipe updated with new image ID.');
		}

		// Call the callback if provided
		onImagesChanged?.([...currentImageIds, imageId]);
		loading = false;
	}

	async function deleteImage() {
		if (!recipeId || !imgId) return;

		loading = true;
		// Delete the image from Supabase storage
		await supabase.storage.from('recipes').remove([`images/${recipeId}/${imgId}`]);

		// Remove the image ID from the recipe's image_ids array
		const updatedImageIds = currentImageIds.filter((id) => id !== imgId);
		const { error } = await supabase
			.from('recipes')
			.update({ image_ids: updatedImageIds })
			.eq('id', recipeId);

		if (error) {
			console.error('Error updating recipe after image deletion:', error);
			toast.error('Failed to update recipe after image deletion.');
		} else {
			toast.success('Image deleted successfully.');
		}

		// Call the callback if provided
		onImagesChanged?.(updatedImageIds);
		loading = false;
	}
</script>

{#if imgId}
	<div class="relative w-full aspect-[1.618] group">
		<img
			src={`${PUBLIC_SUPABASE_URL}/storage/v1/object/public/recipes/images/${recipeId}/${imgId}`}
			alt="Recipe"
			class="aspect-[1.618] w-full rounded-md object-cover"
		/>
		<button
			class="absolute -top-2 -right-2 bg-black rounded-full p-1 hidden group-hover:block"
			onclick={deleteImage}
		>
			<X class="text-white size-4" />
		</button>
	</div>
{:else if loading}
	<div
		class="flex flex-col gap-2 aspect-[1.618] w-full items-center justify-center rounded-md border border-dashed cursor-not-allowed"
	>
		<Loader2
			class={cn('text-muted-foreground animate-spin', size == 'big' ? 'size-8' : 'size-4')}
		/>
	</div>
{:else}
	<label
		class="flex flex-col gap-2 aspect-[1.618] w-full items-center justify-center rounded-md border border-dashed cursor-pointer bg-muted"
		for={`upload-button-${position}`}
	>
		<Camera class={cn('text-muted-foreground', size == 'big' ? 'size-8' : 'size-4')} />
		{#if size === 'big'}
			<span class="pt-2 text-muted-foreground text-sm font-semibold">Click to upload an image</span>
			<span class="text-muted-foreground text-xs">PNG, JPEG, or WEBP</span>
		{/if}
	</label>
	<Input
		id={`upload-button-${position}`}
		type="file"
		class="w-full hidden"
		onchange={(e) => {
			const imageFile = (e.target as HTMLInputElement)?.files?.[0];

			if (imageFile) {
				if (imageFile.size > 5000000) {
					toast.error('File too large.', {
						description: 'Image must be less than 5MB'
					});
					return;
				}

				if (
					imageFile.type !== 'image/png' &&
					imageFile.type !== 'image/jpeg' &&
					imageFile.type !== 'image/webp'
				) {
					toast.error('File not supported.', {
						description: 'Extension must be png, jpg, jpeg, or webp'
					});
					return;
				}

				uploadImage(imageFile);
			}
		}}
	/>
{/if}
