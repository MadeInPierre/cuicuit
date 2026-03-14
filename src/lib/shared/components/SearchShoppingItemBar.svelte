<script lang="ts">
	import { LoaderCircle, SearchIcon, Settings2, X } from 'lucide-svelte';
	import { Button } from './ui/button';
	import * as InputGroup from '$lib/shared/components/ui/input-group/index.js';
	import IngredientSearch from '../../../routes/(app)/recipes/[id]/edit/SearchShoppingItem.svelte';
	import type { IngredientProcessed } from '$lib/features/recipes/modules/parse-ingredients/process';
	import { supabase } from '../db/supabase-client';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { capitalize } from '$lib/utils';

	type Props = {
		class?: string;
	};
	let { class: className }: Props = $props();

	let searchInput = $state('');
	let searchLoading = $state(false);
	let searchRef: HTMLElement | null = $state(null);

	const spaceState = getActiveSpaceState();

	async function onAddItem(
		ingredient: IngredientProcessed | null,
		chosenMatchIndex: number | null
	) {
		if (!ingredient || !spaceState.id) return;

		await supabase.from('space_plan_shopping_lists').insert({
			space_id: spaceState.id,
			type: 'independent',
			ingredient_id: chosenMatchIndex !== null ? ingredient.matches[chosenMatchIndex].id : null,
			quantity: ingredient.parsed.quantity?.amount,
			unit: ingredient.parsed.quantity?.unitKey,
			name: capitalize(ingredient.parsed.ingredientText)
		});

		// Update UI
		await spaceState.refreshActivePlanItems();
	}
</script>

<IngredientSearch
	language="fr-FR"
	onSelect={(ingredient, index) => {
		onAddItem(ingredient, index);
		searchRef?.focus();
		searchInput = '';
	}}
	bind:value={searchInput}
	bind:loading={searchLoading}
	displayRows={2}
	allowCustom
	class={className}
>
	{#snippet input({ ...props })}
		<div class="flex gap-2">
			<InputGroup.Root class="h-8 bg-white dark:bg-muted border-none shadow-2xs">
				<InputGroup.Input
					class=""
					placeholder="Add an item or recipe..."
					bind:value={props.getValue, props.setValue}
					bind:ref={searchRef}
					{...props}
				/>
				<InputGroup.Addon>
					<SearchIcon />
				</InputGroup.Addon>
				{#if searchInput}
					<InputGroup.Addon align="inline-end">
						<InputGroup.Button
							aria-label="Clear search"
							title="Clear search"
							size="icon-xs"
							onclick={() => {
								searchInput = '';
								searchRef?.focus();
							}}
							tabindex={-1}
						>
							<X />
						</InputGroup.Button>
					</InputGroup.Addon>
				{/if}
			</InputGroup.Root>

			<Button variant="default" size="icon" class="h-8" tabindex={-1} title="Toggle meal details">
				{#if searchLoading}
					<LoaderCircle class="size-4 animate-spin" />
				{:else}
					<Settings2 class="size-4" />
				{/if}
			</Button>
		</div>
	{/snippet}
</IngredientSearch>
