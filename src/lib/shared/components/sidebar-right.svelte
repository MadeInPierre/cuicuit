<script lang="ts">
	import { goto } from '$app/navigation';
	import Calendars from '$lib/shared/components/calendars.svelte';
	import DatePicker from '$lib/shared/components/date-picker.svelte';
	import RecipeList from '$lib/features/plans/components/sidebar/recipe-list.svelte';
	import * as Sidebar from '$lib/shared/components/ui/sidebar/index.js';
	import { ArrowRight, Calendar, ChefHat, ScrollText } from 'lucide-svelte';
	import type { ComponentProps } from 'svelte';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root
	bind:ref
	collapsible="none"
	class="sticky top-0 hidden h-svh border-l lg:flex"
	{...restProps}
>
	<Sidebar.Header class="border-sidebar-border border-b grid p-4 gap-0">
		<h1 class="text-md font-semibold">Your plan</h1>
		<p class="text-xs text-muted-foreground">Drag or add recipes here.</p>
	</Sidebar.Header>
	<Sidebar.Content>
		<!-- <DatePicker /> -->
		<!-- <Sidebar.Separator class="mx-0" /> -->
		<!-- <Calendars calendars={data.calendars} /> -->
		<RecipeList />
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
				<Sidebar.MenuButton onclick={() => goto('/list')}>
					<ScrollText />
					<span>Shopping List</span>
					<ArrowRight class="ml-auto opacity-40 group-hover:opacity-100 transition-opacity" />
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
</Sidebar.Root>
