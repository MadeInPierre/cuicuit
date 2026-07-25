<script lang="ts">
	import {
		recipeCoursesSectionHeaders,
		recipeCuisineSectionHeaders,
		recipeTimesOfDaySectionHeaders
	} from '$lib/features/recipes/components/consts';
	import SelectResponsive from '$lib/shared/components/SelectResponsive.svelte';
	import FilterExpanded from './FilterExpanded.svelte';

	type RecipeSearchFilters = {
		timeOfDay: string[];
		course: string[];
		cuisine: string[];
	};

	type Props = {
		filters: RecipeSearchFilters;
		onFilterChange: (key: keyof RecipeSearchFilters, values: string[]) => void;
		layout?: 'horizontal' | 'vertical';
	};

	let { filters, onFilterChange, layout = 'horizontal' }: Props = $props();
</script>

{#if layout === 'horizontal'}
	<div class="flex gap-2">
		<SelectResponsive
			title="Filter by Course"
			emptyLabel="Course"
			description="What are we feeling today?"
			options={Object.entries(recipeCoursesSectionHeaders).map(([key, item]) => ({
				value: key,
				label: item.title,
				icon: item.icon
			}))}
			values={filters.course}
			onChange={(values) => onFilterChange('course', values)}
			displayColumns={2}
			showReset={filters.course?.length > 0}
		/>

		<SelectResponsive
			title="Filter by Cuisine"
			emptyLabel="Cuisine"
			description="Where are we travelling to?"
			options={Object.entries(recipeCuisineSectionHeaders).map(([key, item]) => ({
				value: key,
				label: item.title,
				icon: item.icon
			}))}
			values={filters.cuisine}
			onChange={(values) => onFilterChange('cuisine', values)}
			displayColumns={2}
			showReset={filters.cuisine?.length > 0}
		/>

		<SelectResponsive
			title="Filter by Time of Day"
			emptyLabel="Time"
			description="What are we planning for?"
			options={Object.entries(recipeTimesOfDaySectionHeaders).map(([key, item]) => ({
				value: key,
				label: item.title,
				icon: item.icon
			}))}
			values={filters.timeOfDay}
			onChange={(values) => onFilterChange('timeOfDay', values)}
			displayColumns={2}
			showReset={filters.timeOfDay?.length > 0}
		/>
	</div>
{:else}
	<div class="grid gap-6">
		<FilterExpanded
			title="Filter by Course"
			description="What are we feeling today?"
			options={Object.entries(recipeCoursesSectionHeaders).map(([key, item]) => ({
				value: key,
				label: item.title,
				icon: item.icon
				// description: item.subtitle
			}))}
			values={filters.course}
			onChange={(values) => onFilterChange('course', values)}
		/>

		<FilterExpanded
			title="Filter by Cuisine"
			description="Where are we travelling to?"
			options={Object.entries(recipeCuisineSectionHeaders).map(([key, item]) => ({
				value: key,
				label: item.title,
				icon: item.icon
				// description: item.subtitle
			}))}
			values={filters.cuisine}
			onChange={(values) => onFilterChange('cuisine', values)}
		/>

		<FilterExpanded
			title="Filter by Time of Day"
			description="What are we planning for?"
			options={Object.entries(recipeTimesOfDaySectionHeaders).map(([key, item]) => ({
				value: key,
				label: item.title,
				icon: item.icon
				// description: item.subtitle
			}))}
			values={filters.timeOfDay}
			onChange={(values) => onFilterChange('timeOfDay', values)}
		/>
	</div>
{/if}
