<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Sidebar from '$lib/shared/components/ui/sidebar/index.js';
	import { ArrowRight, LoaderCircle, ScrollText, SearchIcon, Settings2, X } from 'lucide-svelte';
	import type { ComponentProps } from 'svelte';
	import { Button } from './ui/button';
	import PlanList from '$lib/features/plans/components/PlanList.svelte';
	import * as InputGroup from '$lib/shared/components/ui/input-group/index.js';
	import IngredientSearch from '../../../routes/(app)/recipes/[id]/edit/IngredientSearch.svelte';
	import type { IngredientProcessed } from '$lib/features/recipes/modules/parse-ingredients/process';
	import { supabase } from '../db/supabase-client';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

	let searchInput = $state('');
	let searchLoading = $state(false);
	let searchRef: HTMLElement | null = $state(null);

	const spaceState = getActiveSpaceState();

	async function onAddItem(ingredient: IngredientProcessed | null, chosenMatchIndex: number) {
		if (!ingredient || !spaceState.id || chosenMatchIndex === undefined) return;

		await supabase.from('space_plan_shopping_lists').insert({
			space_id: spaceState.id,
			type: 'independent',
			ingredient_id: ingredient.matches[chosenMatchIndex].id,
			quantity: ingredient.parsed.quantity?.amount,
			unit: ingredient.parsed.quantity?.unitKey,
			name: ingredient.sourceText
		});

		// Update UI
		await spaceState.refreshActivePlanItems();
	}
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
				onAddItem(ingredient, index);
				searchRef?.focus();
				searchInput = '';
			}}
			bind:value={searchInput}
			bind:loading={searchLoading}
			displayRows={2}
			class="mt-2"
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

					<Button
						variant="default"
						size="icon"
						class="h-8"
						tabindex={-1}
						title="Toggle meal details"
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
		<PlanList />
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
