<script lang="ts">
	import type { RecipeSearchFilters } from '$lib/features/recipes/state/recipes-search.svelte';
	import SheetResponsive from '$lib/shared/components/SheetResponsive.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { Ellipsis, FunnelPlus, RotateCcw } from '@lucide/svelte';
	import { cn } from 'tailwind-variants';
	import FilterList from './FilterList.svelte';

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
		searchInput || Object.values(filters).some((values) => values.length > 0)
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
	{#if align === 'end' && hasActiveFilters}
		<Button variant="ghost" class="size-7 px-2 text-muted-foreground" onclick={handleReset}>
			<RotateCcw class="size-4" />
		</Button>
	{/if}

	<FilterList {filters} onFilterChange={handleFilterChange} maxVisible={4}>
		{#snippet trailing()}
			{#if align === 'start' && hasActiveFilters}
				<Button
					variant="ghost"
					class="size-7 px-2 text-muted-foreground sm:hidden"
					onclick={handleReset}
				>
					<RotateCcw class="size-4" />
				</Button>
			{/if}
			
			<Button
				variant="ghost"
				class="h-7 shrink-0 bg-muted px-2.5 whitespace-nowrap sm:hidden mr-3"
				onclick={() => (allFiltersOpen = true)}
			>
				<Ellipsis class="size-4" />
				More
			</Button>
		{/snippet}
	</FilterList>

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
	<div class="flex-1 min-h-0 overflow-y-auto px-2 pb-3">
		<FilterList {filters} onFilterChange={handleFilterChange} layout="vertical" />
	</div>

	{#if hasActiveFilters}
		<div class="border-t px-4 py-4 shrink-0">
			<Button variant="outline" class="w-full" onclick={handleReset}>
				<RotateCcw class="size-4" />
				Reset all filters
			</Button>
		</div>
	{/if}
</SheetResponsive>
