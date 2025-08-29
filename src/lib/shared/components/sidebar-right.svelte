<script lang="ts">
	import { goto } from '$app/navigation';
	import Calendars from '$lib/shared/components/calendars.svelte';
	import DatePicker from '$lib/shared/components/date-picker.svelte';
	import MealList from '$lib/features/plans/components/sidebar/meal-list.svelte';
	import * as Sidebar from '$lib/shared/components/ui/sidebar/index.js';
	import * as Tabs from '$lib/shared/components/ui/tabs/index.js';
	import {
		ArrowRight,
		Calendar,
		CalendarPlus,
		Clock,
		FunnelPlus,
		ScrollText,
		Settings2,
		ShoppingBasket
	} from 'lucide-svelte';
	import type { ComponentProps } from 'svelte';
	import Input from './ui/input/input.svelte';
	import { Button } from './ui/button';
	import PlanList from '$lib/features/plans/components/PlanList.svelte';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

	let expandedMealCards = $state(false);
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
				<p class="text-xs text-muted-foreground">
					Drag or add recipes here to create a <br /> meal plan and shopping list.
				</p>
			</div>
			<Button variant="ghost" size="icon" class="size-8" onclick={() => goto('/plan')}>
				<CalendarPlus class="size-4" size="icon" />
				<span class="sr-only">Go to plan</span>
			</Button>
		</div>
		<div class="flex gap-2 mt-2">
			<Input class="h-8 text-xs" placeholder="Add a recipe or item..." />
			<Button
				variant="default"
				size="icon"
				class="h-8"
				onclick={() => (expandedMealCards = !expandedMealCards)}
			>
				<Settings2 class="size-4" />
			</Button>
		</div>
	</Sidebar.Header>
	<Sidebar.Content class="p-4 no-scrollbar">
		<!-- <DatePicker /> -->
		<!-- <Sidebar.Separator class="mx-0" /> -->
		<!-- <Calendars calendars={data.calendars} /> -->

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
