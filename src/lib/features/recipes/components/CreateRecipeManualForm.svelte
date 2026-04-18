<script lang="ts">
	import { goto } from '$app/navigation';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import * as Dialog from '$lib/shared/components/ui/dialog';
	import * as Form from '$lib/shared/components/ui/form';
	import { Input } from '$lib/shared/components/ui/input';
	import { Loader2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { defaults, superForm, type Infer } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { createDraftRecipe } from '../actions/create-draft-recipe';
	import { createRecipeManualSchema, type CreateRecipeManualSchema } from '../models/schemas';

	type Props = {
		openDialog?: boolean;
	};

	let { openDialog = $bindable() }: Props = $props();

	const form = superForm(defaults(zod(createRecipeManualSchema)), {
		SPA: true,
		validators: zod(createRecipeManualSchema),
		onUpdate({ form }) {
			if (form.valid) onSubmit(form.data);
			else toast.error('Please fix the errors in the form.');
		}
	});

	const { form: formData, enhance } = form;

	let loading = $state(false);

	const space = getActiveSpaceState();

	async function onSubmit(data: Infer<CreateRecipeManualSchema>) {
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
			const recipeId = await createDraftRecipe('user-manual', space.language?.id, data.title);

			// Navigate based on completeness
			if (recipeId) {
				toast.success('Recipe created successfully!');
				openDialog = false;
				goto(`/recipes/${recipeId}/edit`);
			} else {
				toast.error('Failed to create recipe. Please try again.');
			}
		} catch (error) {
			toast.error('Failed to create recipe. Please try again.');
		}
		loading = false;
	}
</script>

<form method="POST" use:enhance class="w-full space-y-4">
	<div class="space-y-2">
		<Form.Field {form} name="title">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Recipe title</Form.Label>

					<Input {...props} placeholder="Recipe title..." bind:value={$formData.title} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</div>

	<div class="space-y-2">
		<!-- {#if recipeId}
			<div class="border border-yellow-800 bg-yellow-50 p-2 rounded-md text-yellow-800 text-xs">
				<span class="font-bold"> Warning: </span>
				This will overwrite the current data.
			</div>
		{/if} -->

		<Dialog.Footer class="mt-4">
			<Form.Button type="submit" disabled={loading || !$formData.title} class="w-full">
				{#if loading}
					<div class="flex items-center gap-2">
						<Loader2 class="size-4 animate-spin" />
						Creating recipe...
					</div>
				{:else}
					Create recipe
				{/if}
			</Form.Button>
		</Dialog.Footer>
		<p class="text-muted-foreground text-xs text-center">
			By creating a recipe, you agree to our <a href="/terms" target="_blank" class="underline">
				terms of service
			</a>.
		</p>
	</div>
</form>
