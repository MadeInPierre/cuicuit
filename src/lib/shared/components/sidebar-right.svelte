<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import PlanList from '$lib/features/plans/components/PlanList.svelte';
	import { selectedMealIngredient } from '$lib/features/plans/state/hovered-meal-ingredient.svelte';
	import IngredientImage from '$lib/features/recipes/components/IngredientImage.svelte';
	import { type RecipeIngredientWithTranslations } from '$lib/features/recipes/queries/get-recipe-detailed';
	import * as Sidebar from '$lib/shared/components/ui/sidebar/index.js';
	import { ArrowRight, Calendar, ScrollText, X } from 'lucide-svelte';
	import type { ComponentProps } from 'svelte';
	import SearchSidebar from './search/SearchSidebar.svelte';
	import { Button } from './ui/button';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

{#snippet itemHeader(ingredient: RecipeIngredientWithTranslations)}
	<div class="flex items-center gap-4">
		<IngredientImage id={ingredient.id} class="size-10 rounded-md" />

		<div class="grid">
			<h1 class="text-md font-semibold">
				{ingredient.translations[0]?.name_plural || ingredient.translations[0]?.name_singular}
			</h1>
			<p class="text-xs text-muted-foreground">Detailed meals and items.</p>
		</div>

		<Button
			variant="ghost"
			size="icon"
			class="ml-auto size-8"
			onclick={() => (selectedMealIngredient.value = null)}
		>
			<X class="size-4" size="icon" />
			<span class="sr-only">Close detailed view</span>
		</Button>
	</div>
{/snippet}

<Sidebar.Root
	bind:ref
	collapsible="none"
	class="sticky top-0 hidden h-svh border-r lg:flex w-[300px]"
	{...restProps}
>
	<Sidebar.Header class="border-sidebar-border border-b p-4">
		{#if selectedMealIngredient.value}
			{@render itemHeader(selectedMealIngredient.value)}
		{:else}
			<div class="flex items-center gap-4">
				<div class="grid">
					<h1 class="text-md font-semibold">Your plan</h1>
					<p class="text-xs text-muted-foreground">Add recipes and items to get a shopping list.</p>
				</div>
			</div>
		{/if}

		<SearchSidebar class="mt-2" />
	</Sidebar.Header>

	<Sidebar.Content class="p-4 no-scrollbar">
		<PlanList displayMode="sidebar" filterOnIngredientId={selectedMealIngredient.value?.id} />
	</Sidebar.Content>

	<Sidebar.Footer class="relative">
		<div
			class="pointer-events-none absolute inset-x-0 -top-4 z-50 h-4 bg-gradient-to-t from-sidebar to-transparent"
		></div>

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
						<span>Full plan</span>
						<ArrowRight class="ml-auto" />
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/if}
		</Sidebar.Menu>
	</Sidebar.Footer>
</Sidebar.Root>
