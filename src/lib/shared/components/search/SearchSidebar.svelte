<script lang="ts">
	import { addShoppingItem } from '$lib/features/plans/actions/add-shopping-item';
	import { selectedMealIngredient } from '$lib/features/plans/state/hovered-meal-ingredient.svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import * as InputGroup from '$lib/shared/components/ui/input-group/index.js';
	import { Mic, SearchIcon, X } from '@lucide/svelte';
	import SearchResultsSidebar from './SearchResultsSidebar.svelte';

	type Props = {
		class?: string;
	};
	let { class: className }: Props = $props();

	let inputValue = $state('');
	let searchLoading = $state(false);
	let searchRef: HTMLElement | null = $state(null);

	const space = getActiveSpaceState();
</script>

<SearchResultsSidebar
	onSelect={(ingredient, index) => {
		if (!ingredient) return;
		const quantity = ingredient.parsed.quantity?.amount ?? null;
		const unit = ingredient.parsed.quantity?.unitKey ?? null;
		const name = ingredient.parsed.ingredientText ?? '';
		const ingredientId = index !== null ? (ingredient.matches[index]?.id ?? null) : null;

		// Add the item to the shopping list
		addShoppingItem(space, ingredientId, name, quantity, unit);

		// Reset the sidebar view to show all meals and items
		selectedMealIngredient.value = null;

		// Clear the search input and refocus
		searchRef?.focus();
		inputValue = '';
	}}
	bind:inputValue
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
					placeholder="Add item or recipe..."
					bind:value={props.getValue, props.setValue}
					bind:ref={searchRef}
					{...props}
				/>
				<InputGroup.Addon>
					<SearchIcon />
				</InputGroup.Addon>
				{#if inputValue}
					<InputGroup.Addon align="inline-end">
						<InputGroup.Button
							aria-label="Clear search"
							title="Clear search"
							size="icon-xs"
							onclick={() => {
								inputValue = '';
								searchRef?.focus();
							}}
							tabindex={-1}
						>
							<X />
						</InputGroup.Button>
					</InputGroup.Addon>
				{:else}
					<InputGroup.Addon align="inline-end">
						<InputGroup.Button
							aria-label="Clear search"
							title="Clear search"
							size="icon-xs"
							onclick={() => {
								inputValue = '';
								searchRef?.focus();
							}}
							tabindex={-1}
						>
							<Mic />
						</InputGroup.Button>
					</InputGroup.Addon>
				{/if}
			</InputGroup.Root>
		</div>
	{/snippet}
</SearchResultsSidebar>
