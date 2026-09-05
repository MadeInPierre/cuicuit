<script lang="ts">
	import { goto } from '$app/navigation';
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import { FEATURE_COSTS } from '$lib/features/billing/consts';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import * as Dialog from '$lib/shared/components/ui/dialog';
	import { Label } from '$lib/shared/components/ui/label';
	import { Textarea } from '$lib/shared/components/ui/textarea/index.js';
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';
	import { cn } from '$lib/utils';
	import posthog from 'posthog-js';
	import { toast } from 'svelte-sonner';
	import { slide } from 'svelte/transition';
	import { importRecipeFromText } from '../actions/import-from-url.remote';
	import { importRecipeTextSchema } from '../models/schemas';
	import ImportRecipeStepper from './ImportRecipeStepper.svelte';

	const userState = getUserState();

	type Props = {
		openDialog?: boolean;
	};

	let { openDialog = $bindable() }: Props = $props();

	let text = $state('');
	let textError = $state<string | null>(null);
	let loading = $state(false);
	let currentStep = $state(-1);

	const importSteps = ['Warming up', 'Organizing your recipe', 'Saving ingredients & units'];

	const space = getActiveSpaceState();
	const media = useMedia();

	async function onSubmit() {
		if (loading) throw new Error('A text import is already ongoing, aborting.');

		loading = true;
		currentStep = -1;
		try {
			if (!userState.user?.id) {
				toast.error('You must be logged in to import a recipe.');
				loading = false;
				return;
			}

			if (!space.activeSpace) throw new Error('No active space');
			if (!space.language) throw new Error('No active language');

			let result: { id: string; isComplete: boolean; usage: unknown } | undefined;
			for await (const value of importRecipeFromText({
				spaceId: space.activeSpace.id,
				text,
				fallbackLang: space.language.lang
			})) {
				console.log('Received yield', value);
				if (typeof value === 'number') {
					currentStep = value;
				} else {
					result = value;
				}
			}

			if (!result) throw new Error('Import did not complete.');

			userState.refresh();
			posthog.capture('recipe_imported', {
				source_type: 'text',
				is_complete: result.isComplete
			});

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
			console.error(error);
			toast.error('Failed to import recipe. Please try again.');
		}
		loading = false;
		currentStep = -1;
	}

	function onClick() {
		const result = importRecipeTextSchema.safeParse({ text });
		if (!result.success) {
			textError = result.error.issues[0]?.message ?? 'Please enter your recipe text.';
			toast.error('Please fix the errors in the form.');
			return;
		}
		onSubmit();
	}
</script>

<div class="w-full space-y-4">
	{#if loading}
		<div class="flex justify-center" transition:slide={{ duration: 300 }}>
			<ImportRecipeStepper steps={importSteps} {currentStep} />
		</div>
	{:else}
		<div class="space-y-2" transition:slide={{ duration: 300 }}>
			<Label for="recipe-text">Recipe text</Label>

			<Textarea
				id="recipe-text"
				placeholder="Paste or write a recipe in your own words with ingredients and steps..."
				bind:value={text}
				class="min-h-30 max-h-30 md:max-h-100 min-w-0"
				oninput={() => (textError = null)}
			/>

			{#if textError}
				<p class="text-sm font-medium text-red-600">{textError}</p>
			{/if}
		</div>
	{/if}

	<div class="space-y-2">
		<Dialog.Footer class={cn('sm:flex-col', !media.md && 'bg-transparent border-0')}>
			<Button onclick={onClick} disabled={loading || !text} class="w-full relative">
				<div
					class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs rounded-full bg-lime-100 text-lime-600"
				>
					{FEATURE_COSTS.import_recipe_from_website.seeds} 🌱
				</div>

				{#if loading}
					Importing recipe...
				{:else}
					Import recipe
				{/if}
			</Button>

			{#if (userState.creditBalance?.balance || 0) < FEATURE_COSTS.import_recipe_from_website.seeds}
				<p class="text-xs text-center text-muted-foreground">
					<strong>Note:</strong>
					You have {userState.creditBalance?.balance || 0} 🌱. You are using community seeds. Consider
					supporting us to get &amp; gift seeds!
				</p>
			{/if}
		</Dialog.Footer>
	</div>
</div>
