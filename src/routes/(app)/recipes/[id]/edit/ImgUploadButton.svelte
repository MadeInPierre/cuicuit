<script lang="ts">
	import {
		deleteRecipeImage,
		uploadRecipeImage
	} from '$lib/features/recipes/actions/upload-recipe-image';
	import type { DBRecipeDoc, RecipeDoc } from '$lib/features/recipes/db/recipe-doc';
	import { Input } from '$lib/shared/components/ui/input';
	import type { DocState } from '$lib/shared/db/doc-state.svelte';
	import { cn } from '$lib/utils';
	import { Camera, Loader2, Upload, X } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	type Props = {
		recipeDocState: DocState<RecipeDoc, DBRecipeDoc>;
		size?: 'big' | 'small';
		position?: number;
	};

	let { recipeDocState, position = 0, size = 'big' }: Props = $props();

	let url: string | null = $derived.by(() => {
		if (!recipeDocState?.data?.imageUrls) return null;
		return recipeDocState.data.imageUrls[position];
	});
	let loading = $state(false);

	async function uploadImage(file: File) {
		if (!recipeDocState.id || !recipeDocState.data) return;

		loading = true;
		await uploadRecipeImage(recipeDocState.id, recipeDocState.data, file);

		// wait 1sec to show the loading spinner for better UX
		await new Promise((resolve) =>
			setTimeout(() => {
				loading = false;
				resolve(null);
			}, 1000)
		);
	}

	async function deleteImage() {
		loading = true;
		await deleteRecipeImage(recipeDocState, position);
		loading = false;
	}
</script>

{#if url}
	<div class="relative w-full aspect-[1.618] group">
		<img src={url} alt="Recipe" class="aspect-[1.618] w-full rounded-md object-cover" />
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
