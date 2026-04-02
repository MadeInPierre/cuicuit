<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Sidebar from '$lib/shared/components/ui/sidebar/index.js';
	import { ArrowRight, Calendar, ScrollText, X } from 'lucide-svelte';
	import type { ComponentProps } from 'svelte';
	import PlanList from '$lib/features/plans/components/PlanList.svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import SearchShoppingItemBar from './SearchShoppingItemBar.svelte';
	import { selectedMealIngredient } from '$lib/features/plans/state/hovered-meal-ingredient.svelte';
	import IngredientImage from '$lib/features/recipes/components/IngredientImage.svelte';
	import { Button } from './ui/button';
	import { page } from '$app/state';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

	const spaceState = getActiveSpaceState();
</script>

<Sidebar.Root
	bind:ref
	collapsible="none"
	class="sticky top-0 hidden h-svh border-r lg:flex w-[300px]"
	{...restProps}
>
	<Sidebar.Header class="border-sidebar-border border-b p-4">
		<div class="flex items-center gap-4">
			{#if selectedMealIngredient.value?.id}
				<IngredientImage id={selectedMealIngredient.value.id} class="size-10 rounded-md" />
			{/if}

			<div class="grid">
				<h1 class="text-md font-semibold">
					{#if selectedMealIngredient.value?.id}
						{selectedMealIngredient.value.translations[0]?.name_plural ||
							selectedMealIngredient.value.translations[0]?.name_singular}
					{:else}
						Your plan
					{/if}
				</h1>
				<p class="text-xs text-muted-foreground">
					{#if selectedMealIngredient.value?.id}
						Detailed meals and items.
					{:else}
						Add recipes and items to get a shopping list.
					{/if}
				</p>
			</div>

			{#if selectedMealIngredient.value?.id}
				<Button
					variant="ghost"
					size="icon"
					class="ml-auto size-8"
					onclick={() => (selectedMealIngredient.value = null)}
				>
					<X class="size-4" size="icon" />
					<span class="sr-only">Close detailed view</span>
				</Button>
			{/if}
		</div>

		<SearchShoppingItemBar class="mt-2" />
	</Sidebar.Header>

	<Sidebar.Content class="p-4 no-scrollbar">
		<PlanList displayMode="sidebar" />
	</Sidebar.Content>

	<Sidebar.Footer>
		<Sidebar.Menu>
			{#if !page.url.pathname.startsWith('/shopping-list')}
				<Sidebar.MenuItem class="text-muted-foreground">
					<Sidebar.MenuButton onclick={() => goto('/shopping-list')}>
						<ScrollText />
						<span>Shopping List</span>
						<ArrowRight class="ml-auto" />
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{:else}
				<Sidebar.MenuItem class="text-muted-foreground">
					<Sidebar.MenuButton onclick={() => goto('/plan')}>
						<Calendar />
						<span>See full plan</span>
						<ArrowRight class="ml-auto" />
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/if}
		</Sidebar.Menu>
	</Sidebar.Footer>
</Sidebar.Root>
