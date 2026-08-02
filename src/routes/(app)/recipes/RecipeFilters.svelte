<script lang="ts">
	import SheetResponsive from '$lib/shared/components/SheetResponsive.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { ScrollArea } from '$lib/shared/components/ui/scroll-area';
	import { FunnelPlus, RotateCcw } from '@lucide/svelte';
	import { cn } from 'tailwind-variants';
	import FilterList from './FilterList.svelte';

	type RecipeSearchFilters = {
		timeOfDay: string[];
		course: string[];
		cuisine: string[];
	};

	type Props = {
		align?: 'start' | 'end';
		filters: RecipeSearchFilters;
		onFiltersChange: (filters: RecipeSearchFilters) => void;
		searchInput?: string;
		onReset?: () => void;
	};

	let { align = 'start', filters, onFiltersChange, searchInput = '', onReset }: Props = $props();

	let allFiltersOpen = $state(false);

	const hasActiveFilters = $derived(
		searchInput ||
			filters.timeOfDay.length > 0 ||
			filters.course.length > 0 ||
			filters.cuisine.length > 0
	);

	function handleReset() {
		onReset?.();
	}

	function handleFilterChange(key: keyof RecipeSearchFilters, values: string[]) {
		onFiltersChange({
			...filters,
			[key]: values
		});
	}
</script>

<div class={cn('flex gap-2', align === 'end' && 'justify-end')}>
	<Button
		size="icon-sm"
		class="size-7 rounded-md sm:hidden"
		onclick={() => (allFiltersOpen = true)}
	>
		<FunnelPlus />
	</Button>

	{#if align === 'end' && hasActiveFilters}
		<Button variant="ghost" class="size-7 px-2 text-muted-foreground" onclick={handleReset}>
			<RotateCcw class="size-4" />
		</Button>
	{/if}

	<FilterList {filters} onFilterChange={handleFilterChange} />

	{#if align === 'start' && hasActiveFilters}
		<Button variant="ghost" class="size-7 px-2 text-muted-foreground" onclick={handleReset}>
			<RotateCcw class="size-4" />
		</Button>
	{/if}

	<Button
		size="icon-sm"
		class="size-7 rounded-md hidden sm:flex"
		onclick={() => (allFiltersOpen = true)}
	>
		<FunnelPlus />
	</Button>
</div>

<SheetResponsive
	bind:open={allFiltersOpen}
	title="All Filters"
	description="Find your ideal recipe"
	side="right"
>
	<ScrollArea class="flex-1 px-2">
		<div class="py-4 px-2">
			<FilterList {filters} onFilterChange={handleFilterChange} layout="vertical" />
		</div>
	</ScrollArea>

	{#if hasActiveFilters}
		<div class="border-t px-4 py-4 shrink-0">
			<Button variant="outline" class="w-full" onclick={handleReset}>
				<RotateCcw class="size-4" />
				Reset all filters
			</Button>
		</div>
	{/if}
</SheetResponsive>
