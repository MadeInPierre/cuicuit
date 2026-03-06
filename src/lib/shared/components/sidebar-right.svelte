<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Sidebar from '$lib/shared/components/ui/sidebar/index.js';
	import { ArrowRight, CalendarPlus, ScrollText, Settings2 } from 'lucide-svelte';
	import type { ComponentProps } from 'svelte';
	import Input from './ui/input/input.svelte';
	import { Button } from './ui/button';
	import PlanList from '$lib/features/plans/components/PlanList.svelte';
	import { slide } from 'svelte/transition';
	import { cn } from '$lib/utils';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

	let expandedMealCards = $state(false);
	let searchInput = $state('');
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

		<div
			class={cn(
				'grid gap-2 rounded-md transition-all py-2',
				searchInput.trim() !== '' && 'bg-muted px-2'
			)}
		>
			<div class="flex gap-2">
				<Input
					class="h-8 text-xs"
					placeholder="Add an item or recipe..."
					bind:value={searchInput}
				/>

				<Button
					variant="default"
					size="icon"
					class="h-8"
					onclick={() => (expandedMealCards = !expandedMealCards)}
				>
					<Settings2 class="size-4" />
				</Button>
			</div>

			{#if searchInput.trim() !== ''}
				<div class="grid space-y-4" transition:slide>
					<div class="py-24 text-sm text-muted-foreground flex flex-col items-center">
						No results.
					</div>
				</div>
			{/if}
		</div>
	</Sidebar.Header>
	<Sidebar.Content class="p-4 no-scrollbar">
		<!-- <DatePicker />
		<Sidebar.Separator class="mx-0" />
		<Calendars calendars={data.calendars} /> -->

		<PlanList expanded={expandedMealCards} />
	</Sidebar.Content>
	<Sidebar.Footer>
		<Sidebar.Menu>
			<!-- <Sidebar.MenuItem class="group">
				<Sidebar.MenuButton onclick={() => goto('/plan')}>
					<Calendar />
					<span>Calendar View</span>
					<ArrowRight class="ml-auto opacity-40 group-hover:opacity-100 transition-opacity" />
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
			<Sidebar.MenuItem class="group">
				<Sidebar.MenuButton onclick={() => goto('/recipes')}>
					<ChefHat />
					<span>Add Recipes</span>
					<ArrowRight class="ml-auto opacity-40 group-hover:opacity-100 transition-opacity" />
				</Sidebar.MenuButton>
			</Sidebar.MenuItem> -->
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
