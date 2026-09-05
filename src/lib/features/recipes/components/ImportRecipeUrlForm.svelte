<script lang="ts">
	import { goto } from '$app/navigation';
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import { FEATURE_COSTS } from '$lib/features/billing/consts';
	import { importRecipeFromUrl } from '$lib/features/recipes/actions/import-from-url.remote';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import * as Dialog from '$lib/shared/components/ui/dialog';
	import { Input } from '$lib/shared/components/ui/input';
	import { Label } from '$lib/shared/components/ui/label';
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';
	import { cn } from '$lib/utils';
	import posthog from 'posthog-js';
	import { toast } from 'svelte-sonner';
	import { slide } from 'svelte/transition';
	import { importRecipeUrlSchema } from '../models/schemas';
	import ImportRecipeStepper from './ImportRecipeStepper.svelte';

	const userState = getUserState();

	type Props = {
		openDialog?: boolean;
	};

	let { openDialog = $bindable() }: Props = $props();

	let url = $state('');
	let urlError = $state<string | null>(null);
	let loading = $state(false);
	let currentStep = $state(-1);

	const importSteps = [
		'Finding the recipe',
		'Guessing filters and missing details',
		'Recognizing ingredients & units',
		'Uploading the recipe image'
	];

	const space = getActiveSpaceState();
	const media = useMedia();

	async function onSubmit() {
		if (loading) throw new Error('A web import is already ongoing, aborting.');

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
			for await (const value of importRecipeFromUrl({
				spaceId: space.activeSpace.id,
				url,
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
				source_type: 'url',
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
		const result = importRecipeUrlSchema.safeParse({ url });
		if (!result.success) {
			urlError = result.error.issues[0]?.message ?? 'Oops, please enter a valid URL.';
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
			<Label for="recipe-url">Recipe link</Label>

			<Input
				id="recipe-url"
				type="url"
				placeholder="Paste any link to a recipe..."
				bind:value={url}
				oninput={() => (urlError = null)}
			/>

			{#if urlError}
				<p class="text-sm font-medium text-red-600">{urlError}</p>
			{/if}
		</div>
	{/if}

	<div class="space-y-2">
		<Dialog.Footer class={cn('sm:flex-col', !media.md && 'bg-transparent border-0')}>
			<Button onclick={onClick} disabled={loading || !url} class="w-full relative">
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
