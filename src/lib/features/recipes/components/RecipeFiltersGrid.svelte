<script lang="ts">
	import { recipeCourses, recipeCuisines, recipeTimesOfDay } from '../db/recipe-doc';
	import { capitalize } from '$lib/utils';
	import { BatteryFull, BicepsFlexed, Globe, HandCoins, Salad, Utensils } from '@lucide/svelte';

	import { Skeleton } from '$lib/shared/components/ui/skeleton/index.js';

	type Props = {
		effortLevel: string | null;
		cleanupLevel: string | null;
		skillLevel: string | null;
		timesOfDay: string[] | null;
		cuisines: string[] | null;
		courses: string[] | null;
	};

	let { effortLevel, cleanupLevel, skillLevel, timesOfDay, cuisines, courses }: Props = $props();
</script>

{#if effortLevel == null}
	<div class="grid grid-cols-2 mx-auto lg:grid-cols-3 lg:mx-0 gap-6 justify-items-center">
		{#each [0, 1, 2, 3, 4, 5] as i (i)}
			<div class="flex gap-4 w-40">
				<Skeleton class="min-w-10 size-10 rounded-full" />
				<div class="w-full space-y-2 py-1">
					<Skeleton class="h-3 w-16" />
					<Skeleton class="h-4 w-24" />
				</div>
			</div>
		{/each}
	</div>
{:else}
	<div class="grid grid-cols-2 mx-auto lg:grid-cols-3 lg:mx-0 gap-6 justify-items-center">
		{#snippet recipeFilter(Icon: typeof BatteryFull, title: string, values: string[])}
			<div class="flex gap-4 w-40">
				<div class="min-w-10 h-10 bg-muted rounded-full flex items-center justify-center">
					<Icon class="size-5" />
				</div>
				<div class="w-full flex flex-col gap-0.5">
					<span class="w-full text-xs text-muted-foreground">{title}</span>
					<div class="flex flex-col">
						{#each values as value (value)}
							<span class="text-sm font-semibold">{value}</span>
						{/each}
					</div>
				</div>
			</div>
		{/snippet}

		{@render recipeFilter(BatteryFull, 'Effort', [capitalize(effortLevel)])}
		{@render recipeFilter(HandCoins, 'Cleanup', [capitalize(cleanupLevel)])}
		{@render recipeFilter(BicepsFlexed, 'Skill', [capitalize(skillLevel)])}

		{@render recipeFilter(
			Utensils,
			timesOfDay && timesOfDay.length > 1 ? 'Times of Day' : 'Time of Day',
			timesOfDay?.map((t) => recipeTimesOfDay[t as keyof typeof recipeTimesOfDay]) || ['Unknown']
		)}

		{@render recipeFilter(
			Salad,
			'Cuisine',
			cuisines?.map((c) => recipeCuisines[c as keyof typeof recipeCuisines]) || ['Unknown']
		)}

		{@render recipeFilter(
			Globe,
			'Course',
			courses?.map((c) => recipeCourses[c as keyof typeof recipeCourses]) || ['Unknown']
		)}
	</div>
{/if}
