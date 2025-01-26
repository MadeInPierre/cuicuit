<script lang="ts">
	import { Loader2 } from 'lucide-svelte';
	import { Input } from '$lib/shared/components/ui/input';
	import { toast } from 'svelte-sonner';
	import * as Dialog from '$lib/shared/components/ui/dialog';
	import { superForm, defaults, type Infer } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import * as Form from '$lib/shared/components/ui/form';
	import { imortRecipeUrlSchema, type ImportRecipeUrlSchema } from '../models/schemas';
	import { getUserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
	import { importFromUrl } from '../actions/import-from-url';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	type Props = {
		openDialog?: boolean;
		recipeId?: string | undefined;
	};

	let { openDialog = $bindable(), recipeId = $bindable(undefined) }: Props = $props();

	const userDocState = getUserDocState();

	const form = superForm(defaults(zod(imortRecipeUrlSchema)), {
		SPA: true,
		validators: zod(imortRecipeUrlSchema),
		onUpdate({ form }) {
			if (form.valid) onSubmit(form.data);
			else toast.error('Please fix the errors in the form.');
		}
	});

	const { form: formData, enhance } = form;

	let loading = $state(false);

	async function onSubmit(data: Infer<ImportRecipeUrlSchema>) {
		loading = true;
		try {
			const result = await importFromUrl(data.url, userDocState, recipeId);

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
			<Form.FieldErrors />
		</Form.Field>
	</div>

	<!-- <div class="space-y-2">
		<Form.Fieldset {form} name="url">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>
						Theme <span class="font-normal text-muted-foreground text-xs"> (for you only) </span>
					</Form.Label>

					<div class="flex gap-2 items-center w-full">
						{#each Object.keys(themeButtonClasses) as c}
							<Button
								{...props}
								size="icon"
								variant={c === $formData.theme ? 'link' : 'secondary'}
								onclick={() => ($formData.theme = c)}
								class={cn(
									'w-full size-10 rounded-full',
									c === $formData.theme && `border-2 border-${c}-500`
								)}
							>
								<div class={`size-5 rounded-full bg-${c}-500`}></div>
							</Button>
						{/each}
					</div>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Fieldset>
	</div> -->

	<div class="space-y-2">
		{#if recipeId}
			<div class="border border-yellow-800 bg-yellow-50 p-2 rounded-md text-yellow-800 text-xs">
				<span class="font-bold"> Warning: </span>
				This will overwrite the current data.
			</div>
		{/if}

		<Dialog.Footer class="mt-4">
			<Form.Button type="submit" disabled={loading || !$formData.url} class="w-full">
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
		<p class="text-muted-foreground text-xs">
			By importing a recipe, you agree to our <a href="/terms" target="_blank" class="underline">
				terms of service
			</a>.
		</p>
	</div>
</form>
