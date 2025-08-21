<script lang="ts">
	import { goto } from '$app/navigation';
	import Calendars from '$lib/shared/components/calendars.svelte';
	import DatePicker from '$lib/shared/components/date-picker.svelte';
	import RecipeList from '$lib/features/plans/components/sidebar/meal-list.svelte';
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
			<Input class="h-8 text-xs" placeholder="Search for recipes or items..." />
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
	<Sidebar.Content class="no-scrollbar">
		<!-- <DatePicker /> -->
		<!-- <Sidebar.Separator class="mx-0" /> -->
		<!-- <Calendars calendars={data.calendars} /> -->

		<div class="flex w-full max-w-sm flex-col gap-6">
			{#snippet sectionHeader(Icon: any, title: string, description: string)}
				<div class="flex items-center gap-4">
					<Icon class="size-4" />
					<div class="grid gap-0.5">
						<h3 class="text-sm font-semibold">{title}</h3>
						<p class="text-xs text-muted-foreground">{description}</p>
					</div>
				</div>
			{/snippet}

			<Tabs.Root value="plan" class="p-4">
				<!-- <Tabs.List class="w-full">
					<Tabs.Trigger class="w-full" value="plan">Plan</Tabs.Trigger>
					<Tabs.Trigger class="w-full" value="shopping">Shopping</Tabs.Trigger>
				</Tabs.List> -->
				<Tabs.Content value="plan" class="grid space-y-8">
					<div class="grid space-y-4">
						{@render sectionHeader(
							Calendar,
							'Planned meals',
							'Reserve pantry ingredients for meals'
						)}
						<RecipeList expanded={expandedMealCards} />
					</div>

					<div class="grid space-y-4">
						{@render sectionHeader(Clock, 'Set aside', "Ideas that don't use the pantry")}
						<div
							class="py-10 text-center text-xs text-muted-foreground/60 bg-muted rounded-md flex flex-col items-center gap-2 border border-dashed"
						>
							<Clock class="size-8" />
							<p class="w-28 text-center">Drag recipes here to set aside for later.</p>
						</div>
					</div>

					<div class="grid space-y-4">
						{@render sectionHeader(ShoppingBasket, 'Shopping list', 'Add any additional items')}
						<div
							class="py-10 text-center text-xs text-muted-foreground/60 bg-muted rounded-md flex flex-col items-center gap-2 border border-dashed"
						>
							<ShoppingBasket class="size-8" />
							<p class="mx-auto w-28 text-center">Search for items to add them here.</p>
						</div>
					</div>
				</Tabs.Content>
				<Tabs.Content value="shopping">Here you can manage your grocery list.</Tabs.Content>
			</Tabs.Root>
		</div>
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
