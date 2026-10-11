<script lang="ts">
	import { goto } from '$app/navigation';
	import { FEATURE_COSTS } from '$lib/features/billing/consts';
	import * as Dialog from '$lib/shared/components/ui/dialog';
	import { cn } from '$lib/utils';
	import { Download, FileImage, FileText, Link, Pencil } from '@lucide/svelte';
	import SeparatorZigZag from '../../../../routes/(app)/shopping-list/SeparatorZigZag.svelte';
	import ImportRecipeOptionRow from './ImportRecipeOptionRow.svelte';
	import ImportRecipeUrlForm from './ImportRecipeUrlForm.svelte';

	type Props = {
		openDialog?: boolean;
	};

	let { openDialog = $bindable(false) }: Props = $props();

	/** While the URL input is focused (keyboard open), only input + Go stay visible. */
	let urlFocused = $state(false);

	function goTo(method: 'text' | 'photo' | 'manual') {
		openDialog = false;
		goto(`/recipes/import/${method}`);
	}
</script>

<div class={cn('w-full space-y-4', !urlFocused && 'h-108')}>
	{#if !urlFocused}
		<Dialog.Header class="mt-4 w-full whitespace-nowrap">
			<Dialog.Title class="flex items-center justify-center gap-2">
				<Download class="size-5" />
				Add a recipe
			</Dialog.Title>
			<Dialog.Description class="text-center">
				Paste a link or choose another way to add.
			</Dialog.Description>
		</Dialog.Header>
	{:else}
		<Dialog.Header class="mt-4 w-full whitespace-nowrap">
			<Dialog.Title class="flex items-center justify-center gap-2">
				<Link class="size-5" />
				Drop it like it's hot
			</Dialog.Title>
		</Dialog.Header>
	{/if}

	<ImportRecipeUrlForm compact bind:openDialog bind:focused={urlFocused} />

	{#if !urlFocused}
		<div class="space-y-2">
			<div class="flex items-center gap-2 pb-3">
				<SeparatorZigZag />
				<p class="shrink-0 text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Other options
				</p>
				<SeparatorZigZag />
			</div>

			<nav class="grid gap-2" aria-label="Other import options">
				<ImportRecipeOptionRow
					icon={FileText}
					title="Paste any text"
					badge="{FEATURE_COSTS.import_recipe_from_text.seeds} 🌱"
					onclick={() => goTo('text')}
				/>
				<ImportRecipeOptionRow
					icon={Pencil}
					title="Create from scratch"
					badge="Free"
					onclick={() => goTo('manual')}
				/>
				<ImportRecipeOptionRow
					icon={FileImage}
					title="Upload a photo"
					badge="Soon"
					disabled={true}
				/>
			</nav>
		</div>
	{/if}
</div>
