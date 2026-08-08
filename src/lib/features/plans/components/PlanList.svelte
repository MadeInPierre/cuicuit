<script lang="ts">
	import MealList from '$lib/features/plans/components/sidebar/MealList.svelte';
	import ShoppingItemCard from '$lib/features/recipes/components/ShoppingItemCard.svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { cn, formatDateAgo } from '$lib/utils';
	import { Calendar, ClipboardList, ShoppingBasket, Utensils } from 'lucide-svelte';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';
	import { updatePlanItemDeleted } from '../actions/update-item';

	type Props = {
		displayMode?: 'plan' | 'sidebar';
		filterOnIngredientId?: string | null;
		disableAnimations?: boolean;
	};

	let {
		displayMode = 'plan',
		filterOnIngredientId = null,
		disableAnimations = false
	}: Props = $props();

	const activeSpace = getActiveSpaceState();

	const meals = $derived.by(() => {
		// If hovering over a meal ingredient, only show meals that contain that ingredient
		if (filterOnIngredientId) {
			return (
				activeSpace.activePlanMeals?.filter((meal) =>
					meal.shopping_ingredients.some(
						(si) => si.ingredient_id === filterOnIngredientId && !si.deleted_at
					)
				) || []
			);
		}

		// Otherwise, show all meals
		return activeSpace.activePlanMeals || [];
	});

	// Display recently added independent items
	const independentItems = $derived.by(() => {
		const items =
			activeSpace.activePlanItems?.filter((item) => {
				if (item.type !== 'independent' || item.deleted_at) return false;

				// If hovering over a meal ingredient, only show matching items
				if (filterOnIngredientId) {
					return item.ingredient_id === filterOnIngredientId;
				}

				// Otherwise, include all independent items
				return true;
			}) || [];

		return displayMode === 'sidebar' ? items.slice(0, 12) : items;
	});
</script>

<div class="flex w-full max-w-4xl flex-col gap-4">
	{#snippet sectionHeader(Icon: any, title: string, description: string)}
		<div class={cn('flex items-center gap-2 ml-2', displayMode === 'sidebar' && 'gap-4 ml-0')}>
			<Icon class="size-5" />
			<div class="grid gap-0.5">
				<h3 class="text-sm font-semibold">{title}</h3>
				<!-- {#if displayMode === 'sidebar'} -->
				<p class="text-xs text-muted-foreground">{description}</p>
				<!-- {/if} -->
			</div>
		</div>
	{/snippet}

	<div class={cn('grid space-y-4', displayMode === 'plan' && 'lg:grid-cols-2 lg:gap-4 xl:gap-8')}>
		<div class="flex flex-col w-full gap-4 pb-2">
			{@render sectionHeader(Calendar, 'Planned meals', 'Reserve pantry ingredients')}

			{#if meals.length > 0}
				<MealList
					{meals}
					cardSize={displayMode === 'sidebar' ? 'md' : 'lg'}
					expandOnSelected={displayMode === 'sidebar'}
				/>
			{:else if !filterOnIngredientId}
				<div
					class="py-10 text-center text-sm sm:text-xs text-muted-foreground bg-muted rounded-md flex flex-col items-center gap-4 sm:gap-2"
				>
					<Utensils class="size-8" />
					<p class="mx-auto w-34 sm:w-28 text-center">Search for recipes to add meals here</p>
				</div>
			{:else}
				<div
					class="py-10 text-center text-sm sm:text-xs text-muted-foreground/80 rounded-md flex flex-col items-center gap-4 sm:gap-2 italic"
				>
					No meals with this ingredient
				</div>
			{/if}
		</div>

		<div
			class="flex flex-col w-full gap-2"
			transition:fade={{ duration: disableAnimations ? 0 : 75 }}
		>
			{@render sectionHeader(ClipboardList, 'Anything else?', 'Add items to your grocery list')}

			{#if independentItems && independentItems.length > 0}
				<div
					class={cn(
						'py-2 relative grid grid-cols-1 gap-2',
						displayMode === 'sidebar' && 'max-h-[380px] pb-2 overflow-x-visible overflow-y-clip'
					)}
					class:grid-cols-3={!filterOnIngredientId}
				>
					{#if displayMode === 'sidebar' && independentItems && independentItems.length > 9}
						<div
							class="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-6 bg-gradient-to-t from-sidebar to-transparent"
						></div>
					{/if}

					{#each independentItems as item (item.id)}
						<div animate:flip={{ duration: disableAnimations ? 0 : 200 }}>
							<ShoppingItemCard
								layout={filterOnIngredientId ? 'list' : 'grid'}
								ingredient={item.ingredient}
								name={item.name}
								description={item.quantity
									? item.quantity + ' ' + item.unit?.replace('whole', '')
									: ''}
								plural={item.quantity ? item.quantity > 1 : false}
								size="sm"
								deletable
								onDelete={async () => {
									// TODO add edit functionality (quantity, unit, name)
									await updatePlanItemDeleted(activeSpace, item.id);
								}}
							>
								{#if filterOnIngredientId}
									<span class="text-muted-foreground text-xs">
										{item.updated_at
											? formatDateAgo(new Date(item.updated_at), true)
											: 'Added recently'}

										{item.author_profile.user_name ? `by @${item.author_profile.user_name}` : ''}
									</span>
								{/if}
							</ShoppingItemCard>
						</div>
					{/each}
				</div>
			{:else if !filterOnIngredientId}
				<div
					class="mt-2 py-10 text-center text-sm sm:text-xs text-muted-foreground bg-muted rounded-md flex flex-col items-center gap-4 sm:gap-2"
				>
					<ShoppingBasket class="size-8" />
					<p class="mx-auto w-34 sm:w-28 text-center">Search for items to add them here</p>
				</div>
			{:else}
				<div
					class="mt-2 py-10 text-center text-sm sm:text-xs text-muted-foreground/80 rounded-md flex flex-col items-center gap-4 sm:gap-2 italic"
				>
					No additional items
				</div>
			{/if}
		</div>

		<!-- <div class="grid space-y-4">
				{@render sectionHeader(BellPlus, 'Refill suggestions', 'Ingredients that are running low')}
				<div
					class="py-10 text-center text-xs text-muted-foreground/60 bg-muted rounded-md flex flex-col items-center gap-2"
				>
					<BellPlus class="size-8" />
					<p class="w-28 text-center">
						No low ingredients yet,
						<a class="underline decoration-dotted" href="?#">see rules</a>
					</p>
				</div>
			</div> -->
	</div>
</div>
