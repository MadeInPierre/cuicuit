<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Sidebar from '$lib/shared/components/ui/sidebar/index.js';
	import { ArrowRight, ScrollText } from 'lucide-svelte';
	import type { ComponentProps } from 'svelte';
	import PlanList from '$lib/features/plans/components/PlanList.svelte';
	import type { IngredientProcessed } from '$lib/features/recipes/modules/parse-ingredients/process';
	import { supabase } from '../db/supabase-client';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { capitalize } from '$lib/utils';
	import SearchShoppingItemBar from './SearchShoppingItemBar.svelte';

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

		<SearchShoppingItemBar class="mt-2" />
	</Sidebar.Header>

	<Sidebar.Content class="p-4 no-scrollbar">
		<PlanList />
	</Sidebar.Content>

	<Sidebar.Footer>
		<Sidebar.Menu>
			<Sidebar.MenuItem class="text-muted-foreground">
				<Sidebar.MenuButton onclick={() => goto('/shopping-list')}>
					<ScrollText />
					<span>Shopping List</span>
					<ArrowRight class="ml-auto" />
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
</Sidebar.Root>
