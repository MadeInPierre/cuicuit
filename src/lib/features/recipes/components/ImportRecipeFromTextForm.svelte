<script lang="ts">
	import { goto } from '$app/navigation';
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import { FEATURE_COSTS } from '$lib/features/billing/consts';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import * as Dialog from '$lib/shared/components/ui/dialog';
	import * as Form from '$lib/shared/components/ui/form';
	import { Textarea } from '$lib/shared/components/ui/textarea/index.js';
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';
	import { cn } from '$lib/utils';
	import { Loader2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { defaults, superForm, type Infer } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { importRecipeFromText } from '../actions/import-from-url.remote';
	import { importRecipeTextSchema, type ImportRecipeTextSchema } from '../models/schemas';

	const userState = getUserState();

	type Props = {
		openDialog?: boolean;
	};

	let { openDialog = $bindable() }: Props = $props();

	const form = superForm(defaults(zod4(importRecipeTextSchema)), {
		SPA: true,
		validators: zod4(importRecipeTextSchema),
		onUpdate({ form }) {
			if (form.valid) onSubmit(form.data);
			else toast.error('Please fix the errors in the form.');
		}
	});

	const { form: formData, enhance } = form;

	let loading = $state(false);

	const space = getActiveSpaceState();
	const media = useMedia();

	async function onSubmit(data: Infer<ImportRecipeTextSchema>) {
		loading = true;
		try {
			// Get the user
			if (!userState.user?.id) {
				toast.error('You must be logged in to import a recipe.');
				loading = false;
				return;
			}

			if (!space.activeSpace) throw new Error('No active space');
			if (!space.language) throw new Error('No active language');

			// Import the recipe from the URL
			const result = await importRecipeFromText({
				spaceId: space.activeSpace.id,
				text: data.text,
				fallbackLang: space.language.lang
			});
			userState.refresh();

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
		<Form.Field {form} name="text">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Recipe text</Form.Label>

					<Textarea
						{...props}
						placeholder="Paste or write a recipe in your own words with ingredients and steps..."
						bind:value={$formData.text}
						class="min-h-60 max-h-100"
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors class="text-red-600" />
		</Form.Field>
	</div>

	<div class="space-y-2">
		<Dialog.Footer class={cn('sm:flex-col', !media.md && 'bg-transparent border-0')}>
			<Form.Button type="submit" disabled={loading || !$formData.text} class="w-full relative">
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

			{#if (userState.creditBalance?.balance || 0) < FEATURE_COSTS.import_recipe_from_website.seeds}
				<p class="text-xs text-center text-muted-foreground">
					<strong>Note:</strong>
					You have {userState.creditBalance?.balance || 0} 🌱. You are using community seeds. Consider
					supporting us to get &amp; gift seeds!
				</p>
			{/if}
		</Dialog.Footer>
	</div>
</form>
