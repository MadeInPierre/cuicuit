<script lang="ts">
	import { goto } from '$app/navigation';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import * as Dialog from '$lib/shared/components/ui/dialog';
	import { Input } from '$lib/shared/components/ui/input';
	import { Label } from '$lib/shared/components/ui/label';
	import { Loader2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { createDraftRecipe } from '../actions/create-draft-recipe.remote';
	import { createRecipeManualSchema } from '../models/schemas';
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';
	import { cn } from '$lib/utils';
	import posthog from 'posthog-js';

	type Props = {
		openDialog?: boolean;
	};

	let { openDialog = $bindable() }: Props = $props();

	let title = $state('');
	let titleError = $state<string | null>(null);
	let loading = $state(false);

	const space = getActiveSpaceState();
	const media = useMedia();

	async function onSubmit() {
		loading = true;
		try {
			if (!space.language?.id) {
				toast.error(
					'Active space does not have a language set. Please set a language before creating a recipe.'
				);
				loading = false;
				return;
			}

			// Create a draft recipe
			const recipeId = await createDraftRecipe({
				sourceType: 'user-manual',
				lang: space.language?.lang,
				title
			});

			// Navigate based on completeness
			if (recipeId) {
				posthog.capture('recipe_created', { source_type: 'manual' });
				toast.success('Recipe created successfully!');
				openDialog = false;
				goto(`/recipes/${recipeId}/edit`);
			} else {
				toast.error('Failed to create recipe. Please try again.');
			}
		} catch {
			toast.error('Failed to create recipe. Please try again.');
		}
		loading = false;
	}

	function onClick() {
		const result = createRecipeManualSchema.safeParse({ title });
		if (!result.success) {
			titleError = result.error.issues[0]?.message ?? 'Oops, please enter a valid title.';
			toast.error('Please fix the errors in the form.');
			return;
		}
		onSubmit();
	}
</script>

<div class="w-full space-y-4">
	<div class="space-y-2">
		<Label for="recipe-title">Recipe title</Label>

		<Input
			id="recipe-title"
			placeholder="Start with a title..."
			bind:value={title}
			oninput={() => (titleError = null)}
		/>

		{#if titleError}
			<p class="text-destructive text-sm font-medium text-red-600">{titleError}</p>
		{/if}
	</div>

	<div class="space-y-2">
		<!-- {#if recipeId}
			<div class="border border-yellow-800 bg-yellow-50 p-2 rounded-md text-yellow-800 text-xs">
				<span class="font-bold"> Warning: </span>
				This will overwrite the current data.
			</div>
		{/if} -->

		<Dialog.Footer class={cn('mt-4', !media.md && 'bg-transparent border-0')}>
			<Button onclick={onClick} disabled={loading || !title} class="w-full relative">
				<div
					class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs rounded-full bg-lime-100 text-lime-600"
				>
					Free
				</div>
				{#if loading}
					<div class="flex items-center gap-2">
						<Loader2 class="size-4 animate-spin" />
						Creating recipe...
					</div>
				{:else}
					Create recipe
				{/if}
			</Button>
		</Dialog.Footer>
		<!-- <p class="text-muted-foreground text-xs text-center">
			By creating a recipe, you agree to our <a href="/terms" target="_blank" class="underline">
				terms of service
			</a>.
		</p> -->
	</div>
</div>
