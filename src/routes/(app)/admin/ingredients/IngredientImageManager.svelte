<script lang="ts">
	import { getClientCtx, runOp } from '$lib/core/operations/client.js';
	import type { UploadIngredientImageInput } from '$lib/core/operations/ingredients/upload-image.js';
	import IngredientImage from '$lib/features/recipes/components/IngredientImage.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { Input } from '$lib/shared/components/ui/input';
	import { toast } from 'svelte-sonner';

	type Props = {
		ingredientId: string;
		displayName: string;
	};

	let { ingredientId, displayName }: Props = $props();

	let uploading = $state(false);
	// Bumped after each successful upload so the <img> URL reloads (same storage path).
	let cacheBust = $state(0);

	async function handleFile(file: File | undefined) {
		if (!file) return;
		if (file.size > 5000000) {
			toast.error('File too large.', { description: 'Image must be less than 5MB.' });
			return;
		}
		if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
			toast.error('File not supported.', {
				description: 'Extension must be png, jpg, jpeg, or webp.'
			});
			return;
		}
		uploading = true;
		try {
			await runOp<UploadIngredientImageInput, { path: string }>(
				'ingredients.upload-image',
				await getClientCtx(),
				{ ingredientId, file }
			);
			cacheBust += 1;
			toast.success('Ingredient image replaced.');
		} catch (err) {
			console.error(err);
			toast.error('Failed to upload image.', {
				description: err instanceof Error ? err.message : 'Please try again later.'
			});
		} finally {
			uploading = false;
		}
	}
</script>

<div class="flex items-center gap-4">
	<div class="h-24 w-24 shrink-0">
		{#key cacheBust}
			<IngredientImage id={ingredientId} name={displayName} class="h-24 w-24" />
		{/key}
	</div>
	<div class="grid gap-2">
		<p class="text-sm text-muted-foreground">
			Stored as <code>images/{ingredientId}.jpg</code> — uploading replaces the current image.
		</p>
		<Input
			type="file"
			accept="image/png,image/jpeg,image/webp"
			disabled={uploading}
			onchange={(e) => handleFile((e.target as HTMLInputElement)?.files?.[0])}
		/>
		{#if uploading}
			<p class="text-sm text-muted-foreground">Uploading…</p>
		{/if}
		<Button variant="outline" size="sm" disabled={uploading} onclick={() => (cacheBust += 1)}>
			Refresh preview
		</Button>
	</div>
</div>
