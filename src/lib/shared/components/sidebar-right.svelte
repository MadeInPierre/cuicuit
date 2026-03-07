<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Sidebar from '$lib/shared/components/ui/sidebar/index.js';
	import { ArrowRight, LoaderCircle, ScrollText, Settings2 } from 'lucide-svelte';
	import type { ComponentProps } from 'svelte';
	import Input from './ui/input/input.svelte';
	import { Button } from './ui/button';
	import PlanList from '$lib/features/plans/components/PlanList.svelte';
	import IngredientSearch from '../../../routes/(app)/recipes/[id]/edit/IngredientSearch.svelte';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

	let expandedMealCards = $state(false);
	let searchInput = $state('');
	let searchLoading = $state(false);
</script>

<Sidebar.Root
	bind:ref
	collapsible="none"
	class="sticky top-0 hidden h-svh border-r lg:flex w-[300px]"
	{...restProps}
>
	<Sidebar.Header class="border-sidebar-border border-b p-4">
		<div class="flex items-center gap-8 justify-between">
			<div class="grid">
				<h1 class="text-md font-semibold">Your plan</h1>
				<p class="text-xs text-muted-foreground">Add recipes and items to get a shopping list.</p>
			</div>
			<!-- <Button variant="ghost" size="icon" class="size-8" onclick={() => goto('/plan')}>
				<CalendarPlus class="size-4" size="icon" />
				<span class="sr-only">Go to plan</span>
			</Button> -->
		</div>

		<IngredientSearch
			language="fr-FR"
			onSelect={(ingredient, index) => {
				console.log('Selected ingredient:', ingredient, 'at index:', index);
				searchInput = '';
			}}
			bind:loading={searchLoading}
			displayRows={2}
			class="mt-2"
		>
			{#snippet input({ ...props })}
				<div class="flex gap-2">
					<Input
						class="h-8"
						placeholder="Add an item or recipe..."
						bind:value={searchInput}
						{...props}
					/>

					<Button
						variant="default"
						size="icon"
						class="h-8"
						onclick={() => (expandedMealCards = !expandedMealCards)}
					>
						{#if searchLoading}
							<LoaderCircle class="size-4 animate-spin" />
						{:else}
							<Settings2 class="size-4" />
						{/if}
					</Button>
				</div>
			{/snippet}
		</IngredientSearch>
	</Sidebar.Header>

	<Sidebar.Content class="p-4 no-scrollbar">
		<PlanList expanded={expandedMealCards} />
	</Sidebar.Content>

	<Sidebar.Footer>
		<Sidebar.Menu>
			<Sidebar.MenuItem class="group">
				<Sidebar.MenuButton onclick={() => goto('/shopping-list')}>
					<ScrollText />
					<span>Shopping List</span>
					<ArrowRight class="ml-auto opacity-40 group-hover:opacity-100 transition-opacity" />
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
</Sidebar.Root>
