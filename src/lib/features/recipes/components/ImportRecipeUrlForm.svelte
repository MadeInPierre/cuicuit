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
	import { Loader2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { importRecipeUrlSchema } from '../models/schemas';

	const userState = getUserState();

	type Props = {
		openDialog?: boolean;
	};

	let { openDialog = $bindable() }: Props = $props();

	let url = $state('');
	let urlError = $state<string | null>(null);
	let loading = $state(false);

	const space = getActiveSpaceState();
	const media = useMedia();

	async function onSubmit() {
		if (loading) throw new Error('An web import is already ongoing, aborting.');

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
			console.log('TRIGGERING IMPORT');
			const result = await importRecipeFromUrl({
				spaceId: space.activeSpace.id,
				url,
				fallbackLang: space.language.lang
			});

			// Refresh credit balance
			userState.refresh();
			posthog.capture('recipe_imported', {
				source_type: 'url',
				is_complete: result.isComplete
			});

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
			console.error(error);
			toast.error('Failed to import recipe. Please try again.');
		}
		loading = false;
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
	<div class="space-y-2">
		<Label for="recipe-url">Recipe link</Label>

		<Input
			id="recipe-url"
			type="url"
			placeholder="Paste any link to a recipe..."
			bind:value={url}
			oninput={() => (urlError = null)}
		/>

		{#if urlError}
			<p class="text-destructive text-sm font-medium text-red-600">{urlError}</p>
		{/if}
	</div>

	<div class="space-y-2">
		<!-- {#if recipeId}
			<div class="border border-yellow-800 bg-yellow-50 p-2 rounded-md text-yellow-800 text-xs">
				<span class="font-bold"> Warning: </span>
				This will overwrite the current data.
			</div>
		{/if} -->

		<Dialog.Footer class={cn('sm:flex-col', !media.md && 'bg-transparent border-0')}>
			<Button onclick={onClick} disabled={loading || !url} class="w-full relative">
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
