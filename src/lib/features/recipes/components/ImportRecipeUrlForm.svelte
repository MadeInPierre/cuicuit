<script lang="ts">
	import { goto } from '$app/navigation';
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import { FEATURE_COSTS } from '$lib/features/billing/consts';
	import { importRecipeFromUrl } from '$lib/features/recipes/actions/import-from-url';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import * as Dialog from '$lib/shared/components/ui/dialog';
	import * as Form from '$lib/shared/components/ui/form';
	import { Input } from '$lib/shared/components/ui/input';
	import { Loader2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { defaults, superForm, type Infer } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { importRecipeUrlSchema, type ImportRecipeUrlSchema } from '../models/schemas';
	import { cn } from '$lib/utils';
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';

	const userState = getUserState();

	type Props = {
		openDialog?: boolean;
	};

	let { openDialog = $bindable() }: Props = $props();

	const form = superForm(defaults(zod(importRecipeUrlSchema)), {
		SPA: true,
		validators: zod(importRecipeUrlSchema),
		onUpdate({ form }) {
			if (form.valid) onSubmit(form.data);
			else toast.error('Please fix the errors in the form.');
		}
	});

	const { form: formData, enhance } = form;

	let loading = $state(false);

	const space = getActiveSpaceState();
	const media = useMedia();

	async function onSubmit(data: Infer<ImportRecipeUrlSchema>) {
		loading = true;
		try {
			// Get the user
			if (!userState.user?.id) {
				toast.error('You must be logged in to import a recipe.');
				loading = false;
				return;
			}

			// Import the recipe from the URL
			const result = await importRecipeFromUrl(space, data.url, userState.user.id);

			// Navigate based on completeness
			if (result.isComplete) {
				toast.success('Recipe imported successfully!');
				openDialog = false;
				goto(`/recipes/${result.id}`);
			} else {
				toast.warning('Some fields are missing, please complete the recipe.');
				openDialog = false;
				goto(`/recipes/${result.id}/edit?banner=import-incomplete`);
			}
		} catch (error) {
			toast.error('Failed to import recipe. Please try again.');
		}
		loading = false;
	}
</script>

<form method="POST" use:enhance class="w-full space-y-4">
	<div class="space-y-2">
		<Form.Field {form} name="url">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Recipe link</Form.Label>

					<Input
						{...props}
						placeholder="Paste any link to a recipe..."
						bind:value={$formData.url}
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors class="text-red-600" />
		</Form.Field>
	</div>

	<div class="space-y-2">
		<!-- {#if recipeId}
			<div class="border border-yellow-800 bg-yellow-50 p-2 rounded-md text-yellow-800 text-xs">
				<span class="font-bold"> Warning: </span>
				This will overwrite the current data.
			</div>
		{/if} -->

		<Dialog.Footer class={cn("mt-4", !media.md && 'bg-transparent border-0')}>
			<Form.Button type="submit" disabled={loading || !$formData.url} class="w-full relative">
				<div
					class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs rounded-full bg-lime-100 text-lime-600"
				>
					{FEATURE_COSTS.import_recipe_from_website.seeds} 🌱
				</div>

				{#if loading}
					<div class="flex items-center gap-2">
						<Loader2 class="size-4 animate-spin" />
						Importing recipe...
					</div>
				{:else}
					Import recipe
				{/if}
			</Form.Button>
		</Dialog.Footer>
		<!-- <p class="text-muted-foreground text-xs text-center">
			By importing a recipe, you agree to our
			<a href="/terms" target="_blank" class="underline"> terms of service </a>.
		</p> -->
	</div>
</form>
