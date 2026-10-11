<script lang="ts">
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import { FEATURE_COSTS } from '$lib/features/billing/consts';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import * as Dialog from '$lib/shared/components/ui/dialog';
	import { Input } from '$lib/shared/components/ui/input';
	import { Label } from '$lib/shared/components/ui/label';
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';
	import { cn } from '$lib/utils';
	import { ArrowRight, Loader2, X } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { slide } from 'svelte/transition';
	import {
		completeRecipeImport,
		runUrlImport,
		URL_IMPORT_STEPS
	} from '../actions/run-recipe-import';
	import { importRecipeUrlSchema } from '../models/schemas';
	import { toastImportError } from './import-error-toast';
	import ImportRecipeStepper from './ImportRecipeStepper.svelte';
	import SupportedSources from './SupportedSources.svelte';

	const userState = getUserState();

	type Props = {
		openDialog?: boolean;
		/** Compact inline mode for the mobile menu: input + Go button row, no big footer. */
		compact?: boolean;
		/** Bindable focus state so the parent can hide everything else while typing. */
		focused?: boolean;
	};

	let { openDialog = $bindable(), compact = false, focused = $bindable(false) }: Props = $props();

	let url = $state('');
	let urlError = $state<string | null>(null);
	let loading = $state(false);
	let currentStep = $state(-1);
	let inputEl: HTMLInputElement | null = $state(null);

	const space = getActiveSpaceState();
	const media = useMedia();

	async function onSubmit() {
		if (loading) return;

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

			const result = await runUrlImport(
				{ spaceId: space.activeSpace.id, url, lang: space.language.lang },
				(step) => (currentStep = step)
			);

			openDialog = false;
			completeRecipeImport(userState, result, 'url');
		} catch (error) {
			console.error(error);
			toastImportError(error);
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
		onSubmit().catch(() => toast.error('Failed to import recipe. Please try again.'));
	}

	/** Leaves the focused (keyboard) mode: dismisses the keyboard and restores the full menu. */
	function dismissFocus() {
		inputEl?.blur();
		focused = false;
	}
</script>

<div class="w-full space-y-4">
	{#if compact}
		{#if !focused && !loading}
			<SupportedSources />
		{/if}
		{#if loading}
			<div class="flex justify-center" transition:slide={{ duration: 300 }}>
				<ImportRecipeStepper steps={URL_IMPORT_STEPS} {currentStep} />
			</div>
		{:else}
			<div class="flex gap-2 py-2 mt-4" transition:slide={{ duration: 300 }}>
				{#if focused}
					<Button
						variant="ghost"
						size="icon"
						onclick={dismissFocus}
						class="shrink-0"
						aria-label="Back to import options"
					>
						<X class="size-4" />
					</Button>
				{/if}
				<Input
					id="recipe-url"
					type="url"
					placeholder="Paste any link to a recipe..."
					bind:value={url}
					bind:ref={inputEl}
					oninput={() => (urlError = null)}
					onfocus={() => (focused = true)}
					onblur={() => (focused = false)}
					onkeydown={(e) => {
						if (e.key === 'Enter') onClick();
					}}
					enterkeyhint="go"
					aria-label="Recipe link"
					class="min-w-0 flex-1"
				/>

				<Button
					onclick={onClick}
					disabled={loading || !url}
					class="shrink-0"
					aria-label="Import recipe from link"
				>
					{#if loading}
						<Loader2 class="size-4 animate-spin" />
					{:else}
						Go
						<ArrowRight class="size-4" />
					{/if}
				</Button>
			</div>

			{#if urlError}
				<p class="text-sm font-medium text-red-600">{urlError}</p>
			{/if}
		{/if}
	{:else if loading}
		<div class="flex justify-center" transition:slide={{ duration: 300 }}>
			<ImportRecipeStepper steps={URL_IMPORT_STEPS} {currentStep} />
		</div>
	{:else}
		<SupportedSources />
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

	{#if !compact}
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
	{/if}
</div>
