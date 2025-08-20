<script lang="ts">
	import {
		Bookmark,
		CalendarPlus,
		Check,
		CheckCheck,
		EqualApproximately,
		Loader2,
		LoaderCircle,
		Repeat,
		Scale,
		ShoppingBasket,
		Signal,
		SignalHigh,
		SignalLow,
		SignalMedium,
		Star,
		Users
	} from 'lucide-svelte';
	import { capitalize, cn } from '$lib/utils';
	import type { Tables } from '$lib/shared/db/supabase.types';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_URL_CLOUD } from '$env/static/public';
	import { addRecipeToActivePlan } from '$lib/features/plans/actions/add-recipe-to-plan';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import CardBookmark from '$lib/shared/icons/card-bookmark.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { toast } from 'svelte-sonner';
	import CookableStatus from './CookableStatus.svelte';

	const activeSpace = getActiveSpaceState();

	interface Props {
		recipe?: Tables<'recipes'> | null; // Allow recipe to be null for loading state
		showAddToPlanButton?: boolean; // Optional prop to control visibility of Add to Plan button
		showDetails?: boolean; // Optional prop to control visibility of details
		class?: string;
	}

	let bookmarked: boolean | undefined = $state(false); // TODO

	let {
		recipe = null,
		class: className = '',
		showAddToPlanButton = false,
		showDetails = false
	}: Props = $props();
</script>

{#if recipe}
	<div class={cn('w-60 group flex flex-col items-start rounded-md', className)}>
		{#if recipe.image_ids && recipe.image_ids.length > 0}
			<div class="relative w-full aspect-square rounded-xl overflow-hidden shadow-xs">
				<a href={'/recipes/' + recipe.id} class="shrink-0">
					<img
						src={`${PUBLIC_SUPABASE_URL_CLOUD}/storage/v1/object/public/recipes/images/${recipe.id}/${recipe.image_ids[0]}`}
						alt={recipe.title}
						class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
					/>
				</a>

				{#if recipe.source_type === 'website'}
					<div
						class="absolute top-2 right-2 text-xs rounded-full bg-black/60 text-white py-0.5 px-1.5"
					>
						{recipe.source_type}
					</div>
				{/if}

				<div class="absolute top-2 right-2 grid space-y-2">
					<Button
						variant="ghost"
						size="icon"
						class={cn(
							'size-8 bg-white rounded-full shadow-sm',
							bookmarked === false && 'opacity-0 group-hover:opacity-100 transition-opacity'
						)}
						aria-label="Bookmark recipe"
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
						{:else}
							<LoaderCircle class="size-4 animate-spin text-primary" />
						{/if}
					</Button>

					{#if showAddToPlanButton}
						<Button
							variant="ghost"
							size="icon"
							class="size-8 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
							aria-label="Add to plan"
							onclick={() => addRecipeToActivePlan(activeSpace, recipe.id, recipe.servings)}
						>
							<CalendarPlus class="size-4" />
						</Button>
					{/if}
				</div>

				<div class="absolute bottom-2 left-2 flex items-center gap-2 text-xs">
					<div class="bg-white rounded-full px-2 py-0.5 flex items-center gap-1">
						<div class="relative flex items-center" style="width: 1rem; height: 1rem;">
							<Signal class="absolute top-0 left-0 size-3.5 text-muted rounded-full" />

							{#if recipe.effort_level == 'none'}
								<SignalLow class="absolute top-0 left-0 size-3.5 rounded-full text-green-600" />
							{:else if recipe.effort_level == 'low'}
								<SignalMedium class="absolute top-0 left-0 size-3.5 rounded-full text-green-600" />
							{:else if recipe.effort_level == 'medium'}
								<SignalHigh class="absolute top-0 left-0 size-3.5 text-yellow-600" />
							{:else if recipe.effort_level == 'high'}
								<Signal class="absolute top-0 left-0 size-3.5 text-red-600" />
							{/if}
						</div>

						<span>{recipe.time_total_minutes} min</span>
					</div>

					<!-- <div class="bg-white rounded-full px-2 pl-0.5 py-0.5 flex items-center gap-1">
						<Star class="size-3.5 ml-1 text-amber-400" fill="#fef08a" />
						<span>4.5</span>
						<span class="text-[10px] text-muted-foreground">(134)</span>
					</div> -->
				</div>

				<!-- <CardBookmark class="absolute -top-[12px] right-[8px] size-10" /> -->
			</div>
		{:else}
			<div class="w-full aspect-square bg-gray-200 rounded-md"></div>
		{/if}
		<div class="flex items-center gap-2 p-2 w-full">
			<a class="grid w-full" href={'/recipes/' + recipe.id}>
				<h3 class="text-sm font-semibold line-clamp-1">{recipe.title}</h3>

				<!-- {#if showDetails}
					<div class="text-xs text-muted-foreground flex items-center">
						<span class="mr-4">{recipe.time_total_minutes}min</span>

						<span class="mr-4">{capitalize(recipe.effort_level)} effort</span>

						<span>{recipe.servings}</span>
						<Users class="size-3 inline-block ml-0.5 mr-4" />
					</div>
				{/if} -->

				<CookableStatus />
			</a>
		</div>
	</div>
{:else}
	<div
		class={cn('w-60 group flex flex-col items-start bg-white dark:bg-muted rounded-md', className)}
	>
		<div
			class="w-full aspect-square bg-gray-200 dark:bg-gray-900 rounded-xl overflow-hidden animate-pulse"
		></div>

		<div class="flex items-center gap-2 p-2 w-full">
			<div class="grid w-full">
				<div class="h-4 bg-gray-200 dark:bg-gray-900 rounded animate-pulse"></div>
				{#if showDetails}
					<div class="mt-2 flex items-center text-xs text-muted-foreground">
						<span class="mr-4 h-3 w-8 bg-gray-200 dark:bg-gray-900 rounded animate-pulse"></span>
						<span class="mr-4 h-3 w-10 bg-gray-200 dark:bg-gray-900 rounded animate-pulse"></span>
						<span class="h-3 w-6 bg-gray-200 dark:bg-gray-900 rounded animate-pulse"></span>
						<span
							class="size-3 inline-block ml-0.5 mr-4 bg-gray-200 dark:bg-gray-900 rounded-full animate-pulse"
						></span>
					</div>
				{/if}
				<div class="flex flex-col gap-1 mt-2">
					<div class="h-3 w-24 bg-gray-200 dark:bg-gray-900 rounded animate-pulse mb-1"></div>
				</div>
			</div>
		</div>
	</div>
{/if}
