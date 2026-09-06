<script lang="ts">
	import { goto } from '$app/navigation';
	import { addRecipeToActivePlan } from '$lib/features/plans/actions/add-recipe-to-plan';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { cn, formatTime } from '$lib/utils';
	import {
		CalendarPlus,
		ChefHat,
		Signal,
		SignalHigh,
		SignalLow,
		SignalMedium
	} from '@lucide/svelte';
	import { onMount } from 'svelte';
	import type { Recipe } from '../queries/get-recipe-detailed';
	import RecipeImage from './RecipeImage.svelte';

	const activeSpace = getActiveSpaceState();

	interface Props {
		recipe?: Recipe | null; // Allow recipe to be null for loading state
		showAddToPlanButton?: boolean; // Optional prop to control visibility of Add to Plan button
		class?: string;
	}

	let isTouchscreen = $state(false);
	onMount(() => {
		isTouchscreen =
			typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
	});

	let bookmarked: boolean | undefined = $state(false); // TODO

	let { recipe = null, class: className = '', showAddToPlanButton = false }: Props = $props();
</script>

{#if recipe}
	<div class={cn('w-full max-w-full group flex flex-col items-start', className)}>
		{#if (recipe.image_ids && recipe.image_ids.length > 0) || recipe.source_url?.includes('youtu')}
			<div class="relative w-full aspect-4/3 rounded-lg overflow-hidden shadow-2xs">
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<!-- svelte-ignore a11y_missing_attribute -->
				<a class="w-full h-full" onclick={() => goto('/recipes/' + recipe.id)}>
					<RecipeImage {recipe} class="w-full aspect-4/3 h-full object-cover" />
				</a>

				<div class="absolute top-2 right-2 grid space-y-2 z-10">
					<!-- <Button
						variant="ghost"
						size="icon"
						class={cn(
							'size-8 bg-white hover:bg-slate-100 rounded-full shadow-sm',
							bookmarked === false && 'opacity-0 group-hover:opacity-100 transition-opacity'
						)}
						aria-label="Add to cookbook"
						title="Add to cookbook"
						onclick={async () => {
							// TODO: Implement bookmark functionality
							const prev = bookmarked || false;
							const toastId = toast.loading(
								prev ? 'Removing from cookbook...' : 'Adding to cookbook...'
							);
							bookmarked = undefined; // Mark as loading
							await new Promise((resolve) => setTimeout(resolve, 1000));
							bookmarked = !prev;
							toast.success(prev ? "Removed from 'Flemme'" : "Added to 'Flemme'", {
								id: toastId,
								description: 'Click here to edit',
								action: {
									label: 'Edit',
									onClick: () => {
										// TODO: Implement edit functionality
									}
								}
							});
						}}
					>
						{#if bookmarked === true}
							<Bookmark class="size-4" fill="orange" color="orange" />
						{:else if bookmarked === false}
							<Bookmark class="size-4" fill="none" color="black" />
						{/if}
					</Button> -->

					{#if showAddToPlanButton}
						<Button
							variant="ghost"
							size="icon"
							class={cn(
								'size-8 sm:size-7 bg-white hover:bg-slate-100 rounded-full shadow-sm',
								!isTouchscreen && 'opacity-0 group-hover:opacity-100 transition-opacity'
							)}
							aria-label="Add to plan"
							title="Add to plan"
							onclick={() => {
								if (recipe.id && recipe.servings) {
									addRecipeToActivePlan(activeSpace, recipe.id, recipe.servings);
								}
							}}
						>
							<CalendarPlus class="size-4 sm:size-3.5 text-black" />
						</Button>
					{/if}
				</div>

				<div class="absolute bottom-2 left-2 flex items-center gap-2 text-[11px] z-10">
					<div
						class="bg-white dark:bg-background/60 rounded-full px-1.5 py-0 flex items-center gap-1"
					>
						<div class="relative flex items-center" style="width: 1rem; height: 1rem;">
							<Signal class="absolute top-0 left-0 size-3 text-muted rounded-full" />

							{#if recipe.effort_level == 'none'}
								<SignalLow class="absolute top-0 left-0 size-3 rounded-full text-green-600" />
							{:else if recipe.effort_level == 'low'}
								<SignalMedium class="absolute top-0 left-0 size-3 rounded-full text-green-600" />
							{:else if recipe.effort_level == 'medium'}
								<SignalHigh class="absolute top-0 left-0 size-3 text-yellow-600" />
							{:else if recipe.effort_level == 'high'}
								<Signal class="absolute top-0 left-0 size-3 text-red-600" />
							{/if}
						</div>

						<span class="select-none">{formatTime(recipe.time_total_minutes || 0)}</span>
					</div>

					<!-- <div class="bg-white rounded-full px-2 pl-0.5 py-0.5 flex items-center gap-1">
						<Star class="size-3.5 ml-1 text-amber-400" fill="#fbbf24" />
						<span>4.5</span>
						<span class="text-[10px] text-muted-foreground">(134)</span>
					</div> -->
				</div>
			</div>
		{:else}
			<a
				href={'/recipes/' + recipe.id}
				class="w-full aspect-4/3 bg-muted rounded-lg flex items-center justify-center shadow-2xs"
				aria-label={'Recipe ' + recipe.title}
			>
				<ChefHat class="size-1/4 text-muted-foreground" />
			</a>
		{/if}

		<div class="flex items-center gap-2 p-2 w-full">
			<a class="grid w-full" href={'/recipes/' + recipe.id}>
				<h3 class="text-sm font-medium line-clamp-2">
					<!-- <span class="mr-2 text-muted-foreground text-xs font-normal">{recipe.servings} 
						<Users class="size-3 inline-block -translate-y-[1px]" />
					</span> -->
					{recipe.title}
				</h3>

				<!-- <div class="text-xs text-muted-foreground flex items-center">
					<span class="mr-4">{recipe.time_total_minutes}min</span>

					<span class="mr-4">{capitalize(recipe.effort_level)}</span>

					<span>{recipe.servings}</span>
					<Users class="size-3 inline-block ml-0.5 mr-4" />
				</div> -->

				<!-- <CookableStatus /> -->
			</a>
		</div>
	</div>
{:else}
	<div class={cn('w-full group flex flex-col items-start', className)}>
		<div class="relative w-full aspect-4/3 rounded-lg overflow-hidden">
			<div
				class="absolute inset-0 bg-muted dark:bg-muted animate-pulse flex items-center justify-center"
			>
				<!-- <ChefHat class="size-12 text-muted-foreground" /> -->
			</div>
		</div>

		<div class="flex items-center gap-2 p-2 w-full">
			<div class="grid w-full">
				<div class="h-4 bg-muted dark:bg-muted rounded animate-pulse"></div>
				<div class="h-3 w-20 bg-muted dark:bg-muted rounded animate-pulse mt-2"></div>
			</div>
		</div>
	</div>
{/if}
