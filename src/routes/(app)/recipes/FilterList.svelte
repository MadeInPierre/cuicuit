<script lang="ts">
	import { recipeFilterDefs } from '$lib/features/recipes/components/recipe-filter-defs';
	import type {
		RecipeFilterKey,
		RecipeSearchFilters
	} from '$lib/features/recipes/state/recipes-search.svelte';
	import SelectResponsive from '$lib/shared/components/SelectResponsive.svelte';
	import type { Snippet } from 'svelte';
	import FilterExpanded from './FilterExpanded.svelte';

	type Props = {
		filters: RecipeSearchFilters;
		onFilterChange: (key: RecipeFilterKey, values: string[]) => void;
		layout?: 'horizontal' | 'vertical';
		/** Only show the first N filters (used by the inline ribbon; the sheet shows all). */
		maxVisible?: number;
		/** Extra content at the end of the horizontal row, scrolling along with the pills. */
		trailing?: Snippet;
	};

	let { filters, onFilterChange, layout = 'horizontal', maxVisible, trailing }: Props = $props();

	const visibleDefs = $derived(
		maxVisible === undefined ? recipeFilterDefs : recipeFilterDefs.slice(0, maxVisible)
	);
</script>

{#if layout === 'horizontal'}
	<div
		class="flex flex-1 min-w-0 flex-nowrap items-center gap-2 overflow-x-auto scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden *:shrink-0"
	>
		{#each visibleDefs as def (def.key)}
			<SelectResponsive
				title={def.title}
				emptyLabel={def.emptyLabel}
				description={def.description}
				options={def.options}
				values={filters[def.key]}
				onChange={(values) => onFilterChange(def.key, values)}
				displayColumns={2}
				showReset={filters[def.key]?.length > 0}
			/>
		{/each}

		{@render trailing?.()}
	</div>
{:else}
	<div class="grid gap-6 pb-6">
		{#each recipeFilterDefs as def (def.key)}
			<FilterExpanded
				title={def.title}
				description={def.description}
				options={def.options}
				values={filters[def.key]}
				onChange={(values) => onFilterChange(def.key, values)}
			/>
		{/each}
	</div>
{/if}
