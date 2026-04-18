<script lang="ts">
	import {
		updatePlanItemChecked,
		updatePlanItemDeleted
	} from '$lib/features/plans/actions/update-item';
	import MealCard from '$lib/features/plans/components/MealListItem.svelte';
	import { hoveredMealIngredient } from '$lib/features/plans/state/hovered-meal-ingredient.svelte';
	import { supermarketAisleSectionHeaders } from '$lib/features/recipes/components/consts';
	import ShoppingItemCard from '$lib/features/recipes/components/ShoppingItemCard.svelte';
	import {
		getShoppingRecommendations,
		type ShoppingRecommendation
	} from '$lib/features/spaces/queries/get-shopping-recommendations';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import SearchShoppingItemBar from '$lib/shared/components/SearchShoppingItemBar.svelte';
	import SectionHeader from '$lib/shared/components/SectionHeader.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { Separator } from '$lib/shared/components/ui/separator';
	import * as Tabs from '$lib/shared/components/ui/tabs/index.js';
	import { createPersistentState } from '$lib/shared/state/create-persistent-state.svelte';
	import { cn } from '$lib/utils';
	import {
		Apple,
		BetweenHorizonalEnd,
		Calendar,
		ChefHat,
		ClipboardList,
		Grid3x3,
		List,
		PanelBottom,
		RotateCcw,
		ShoppingBasket,
		User,
		Users
	} from 'lucide-svelte';
	import { flip } from 'svelte/animate';
	import { slide } from 'svelte/transition';
	import FilterSelect from '../recipes/FilterSelect.svelte';
	import DoneShoppingButton from './DoneShoppingButton.svelte';
	import {
		type CombinedShoppingListItem,
		formatCombinedItemQuantity,
		generateShoppingList
	} from './generate-shopping-list';
	import ItemDrawer from './ItemDrawer.svelte';
	import SeparatorZigZag from './SeparatorZigZag.svelte';
	import ShoppingRecommendations from './ShoppingRecommendations.svelte';
	import ShoppingRecommendationsList from './ShoppingRecommendationsList.svelte';
	import ShoppingRecommendationsMobile from './ShoppingRecommendationsMobile.svelte';

	const space = getActiveSpaceState();
	const meals = $derived(space.activePlanMeals || []);
	const items = $derived(space.activePlanItems || []);

	const shoppingList: CombinedShoppingListItem[] = $derived(generateShoppingList(meals, items));

	let checkedItemsLayout = createPersistentState<'aisle' | 'bottom'>(
		'view-shopping-list-checked-items-layout',
		'aisle'
	);

	let itemsLayout = createPersistentState<'grid' | 'list'>(
		'view-shopping-list-items-layout',
		'list'
	);

	let shoppingListFilter = $state<'all' | 'meals' | 'independent'>('all');

	/** Update an item from all its origins at once */
	async function onItemCheckedChange(shoppingItem: CombinedShoppingListItem, newChecked: boolean) {
		const originIdsToUpdate = shoppingItem.items.map((si) => si.id);
		await Promise.all(
			originIdsToUpdate.map((id) =>
				updatePlanItemChecked(space, id, newChecked, { skipRefresh: true })
			)
		);

		// Refresh after all updates are done to avoid UI jitter
		space.refreshActivePlanMeals();
		space.refreshActivePlanItems();
	}

	let rawShoppingRecommendations = $state<ShoppingRecommendation[] | undefined>(undefined);
	let recentRecommendations = $state<Record<string, ShoppingRecommendation[]>>({});

	async function refreshRecommendations() {
		if (!space.id || !space.language) return;
		const recommendations = await getShoppingRecommendations(space.id, space.language.lang);
		rawShoppingRecommendations = recommendations;
	}

	function onShuffle(aisleKey: string, currentRecommendations: ShoppingRecommendation[]) {
		// Don't show the same recommendations again on shuffle
		recentRecommendations[aisleKey] = [
			...currentRecommendations,
			...(recentRecommendations[aisleKey] || [])
		].slice(0, 100);
	}

	// Keep recommendations that are not already in the shopping list or recently recommended
	let shoppingRecommendations = $derived(
		rawShoppingRecommendations?.filter(
			(rec) =>
				!shoppingList.some((item) => item.ingredient?.id === rec.ingredient_id) &&
				!recentRecommendations[rec.aisle]?.some((r) => r.ingredient_id === rec.ingredient_id)
		) || []
	);

	// Load recommendations on mount and when space changes
	$effect(() => {
		// Triggers
		space.id;
		space.language;

		refreshRecommendations();
	});
</script>

<ItemDrawer />

<div class="space-y-6 pb-16 min-h-full">
	<div class="flex items-center">
		<div class="space-y-1">
			<h2 class="text-2xl font-bold tracking-tight">Shopping list</h2>

			<div class="flex items-center gap-2 text-muted-foreground">
				<span>Items by aisle, filtered by</span>

				<FilterSelect
					bind:value={shoppingListFilter}
					options={[
						{
							value: 'all',
							label: 'All items',
							description: 'Meals and additional items together',
							icon: Apple
						},
						{
							value: 'meals',
							label: 'Meals only',
							description: 'Ingredients that are part of planned meals',
							icon: Calendar
						},
						{
							value: 'independent',
							label: 'Additional only',
							description: 'Items added by members',
							icon: ClipboardList
						}
					]}
				/>

				{#if shoppingListFilter !== 'all'}
					<Button
						variant="ghost"
						size="icon"
						class="size-7"
						onclick={() => {
							shoppingListFilter = 'all';
						}}
					>
						<RotateCcw class="min-w-4 h-4" />
						<span class="sr-only">Show all items</span>
					</Button>
				{/if}
			</div>
		</div>
	</div>

	<SearchShoppingItemBar class="md:hidden" />

	<Separator class="my-6" />

	<Tabs.Root value="aisle">
		<div class="flex gap-2 items-center">
			<Tabs.List>
				<Tabs.Trigger value="aisle">By Aisle</Tabs.Trigger>
				<Tabs.Trigger value="recipe">By Recipe</Tabs.Trigger>
			</Tabs.List>

			<Button
				variant="ghost"
				size="icon"
				onclick={() => {
					itemsLayout.set(itemsLayout.value === 'grid' ? 'list' : 'grid');
				}}
			>
				{#if itemsLayout.value === 'grid'}
					<List class="min-w-4 h-4" />
					<span class="sr-only">Switch to list view</span>
				{:else}
					<Grid3x3 class="min-w-4 h-4" />
					<span class="sr-only">Switch to grid view</span>
				{/if}
			</Button>

			<Button
				variant="ghost"
				size="icon"
				onclick={() => {
					checkedItemsLayout.set(checkedItemsLayout.value === 'aisle' ? 'bottom' : 'aisle');
				}}
			>
				{#if checkedItemsLayout.value === 'aisle'}
					<PanelBottom class="min-w-4 h-4" />
					<span class="sr-only">Switch to bottom view</span>
				{:else}
					<BetweenHorizonalEnd class="min-w-4 h-4" />
					<span class="sr-only">Switch to aisle view</span>
				{/if}
			</Button>

			<DoneShoppingButton onclick={refreshRecommendations} class="ml-auto" />
		</div>

		<Tabs.Content value="aisle" class="mt-8">
			<!-- <h3 class="text-xl font-semibold mb-6">Planned meals</h3> -->
			<!-- <RecipeCarousel recipes={meals.map((meal) => meal.recipe)} /> -->
			<!-- <h3 class="mt-6 text-xl font-semibold mb-6">Shopping list</h3> -->

			<div class="grid grid-cols-1">
				<div class={cn('grid space-y-12', itemsLayout.value === 'list' && 'space-y-12')}>
					{#each Object.entries(supermarketAisleSectionHeaders)

						// Show aisles that have items or recommendations
						.filter(([aisleKey]) => {
							// Apply view filter
							if (shoppingListFilter === 'meals') {
								// Show aisle if it has any meal items
								return shoppingList.some((item) => item.meals.length > 0 && (item.ingredient?.aisle || 'default') === aisleKey);
							} else if (shoppingListFilter === 'independent') {
								// Show aisle if it has any independent items
								return shoppingList.some( (item) => item.items.some((si) => si.type === 'independent' && (item.ingredient?.aisle || 'default') === aisleKey) );
							}

							// Show aisle if it has items or recommendations, depending on UI layout
							if (checkedItemsLayout.value === 'bottom') {
								// Show aisle if it has any unchecked items
								return shoppingList.some((item) => (item.ingredient?.aisle || 'default') === aisleKey && item.items.some((si) => !si.checked_at));
							} else if (checkedItemsLayout.value === 'aisle') {
								// Show aisle if it has any items
								if (shoppingList.some((item) => (item.ingredient?.aisle || 'default') === aisleKey)) return true;

								// Show aisle if it has recommendations
								return shoppingRecommendations.some((rec) => rec.aisle === aisleKey);
							}
							throw new Error('Invalid checked items layout');
						}) as [aisleKey, aisleHeader] (aisleKey)}
						{@const aisleItems = shoppingList.filter((item) => {
							// Skip items that don't belong to the aisle
							if ((item.ingredient?.aisle || 'default') !== aisleKey) return false;

							// Apply UI layout filter
							if (checkedItemsLayout.value === 'bottom')
								return item.items.some((si) => !si.checked_at);

							// Apply view filter
							if (shoppingListFilter === 'meals') return item.meals.length > 0;
							if (shoppingListFilter === 'independent')
								return item.items.some((si) => si.type === 'independent');
							return true; // Just in case, should not happen
						})}

						{@const aisleRecommendations = shoppingRecommendations.filter(
							(rec) => rec.aisle === aisleKey
						)}

						<section transition:slide={{ duration: 300 }}>
							<div class="mb-4 flex items-center justify-between">
								<SectionHeader header={aisleHeader} size="sm" class="" />

								{#if checkedItemsLayout.value === 'aisle'}
									<ShoppingRecommendations
										recommendations={aisleRecommendations.slice(0, 4)}
										total={aisleRecommendations.length}
										onShuffle={(current) => onShuffle(aisleKey, current)}
										loading={rawShoppingRecommendations === undefined}
									/>
								{/if}
							</div>

							<div class="grid space-y-4 md:ml-5 md:pl-8 lg:pl-12 md:border-l-2">
								{#if checkedItemsLayout.value === 'aisle'}
									<ShoppingRecommendationsMobile
										recommendations={aisleRecommendations.slice(0, 10)}
										total={aisleRecommendations.length}
										onShuffle={(current) => onShuffle(aisleKey, current)}
										loading={rawShoppingRecommendations === undefined}
									/>
								{/if}

								{@render itemsGrid(aisleItems)}
							</div>
						</section>
					{/each}

					{#if checkedItemsLayout.value === 'bottom'}
						<div class="grid space-y-3">
							<SeparatorZigZag />

							{#if shoppingList.some((item) => item.items.some((si) => si.checked_at))}
								<div class="grid pt-8">
									<div class="mb-4 flex items-center justify-between">
										<SectionHeader
											header={{
												title: 'Your cart',
												subtitle:
													'These items are checked but not yet removed from the list. You can uncheck them to move them back to the top.',
												icon: ShoppingBasket
											}}
											size="sm"
										/>

										<DoneShoppingButton onclick={refreshRecommendations} />
									</div>

									<div class="grid space-y-2 md:ml-5 md:pl-8 lg:pl-12 md:border-l-2">
										{@render itemsGrid(
											shoppingList.filter((item) => item.items.some((si) => si.checked_at))
										)}
									</div>
								</div>
							{/if}

							<div class="grid space-y-2 xl:space-y-4">
								<h3 class="pt-8 text-md font-medium">You might also need:</h3>
								<div class="overflow-hidden max-h-44 xl:max-h-26">
									<ShoppingRecommendationsList
										recommendations={shoppingRecommendations.slice(0, 30)}
										loading={rawShoppingRecommendations === undefined}
										class="flex-wrap min-w-auto m-0.5"
									/>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</Tabs.Content>

		<Tabs.Content value="recipe" class="mt-8">
			<h3 class="text-xl font-semibold mb-6">Planned meals</h3>

			<div class="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-auto">
				{#each meals as meal (meal.id)}
					<div class="w-full">
						<MealCard {meal} showExpandedButtons class="" />
					</div>
				{/each}
			</div>

			<span>
				TODO show not-expanded planned meals that already have all ingredients in the pantry
			</span>
		</Tabs.Content>
	</Tabs.Root>
</div>

{#snippet itemsGrid(items: CombinedShoppingListItem[])}
	<!-- old for list: <div class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-2 md:gap-4">
			{#each items as item (item.ingredient?.id || item.name)}
				<div class="flex group" animate:flip={{ duration: 300 }}> -->
	<div
		class={cn(
			'grid gap-2',
			itemsLayout.value === 'grid' &&
				'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 ',
			itemsLayout.value === 'list' &&
				'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 lg:gap-3'
		)}
	>
		{#each items as item (item.ingredient?.id || item.name)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div
				class="flex group"
				animate:flip={{ duration: 200 }}
				onmouseenter={() => {
					if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) return;
					if (!item.ingredient) return; // No hover state for manual items
					hoveredMealIngredient.value = item.ingredient;
				}}
				onmouseleave={() => {
					if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) return;
					hoveredMealIngredient.value = null;
				}}
			>
				<ShoppingItemCard
					layout={itemsLayout.value || 'grid'}
					ingredient={item.ingredient}
					name={item.name}
					description={formatCombinedItemQuantity(item)}
					plural={Object.entries(item.mergedQuantity).some(
						([_, quantities]) => quantities.withOptionals > 1
					)}
					size="md"
					selectable
					onDelete={() => {
						// Soft delete all origins of the item
						item.items.forEach((si) => updatePlanItemDeleted(space, si.id));
					}}
					checked={item.items.some((si) => si.checked_at)}
					onCheckedChange={(newChecked) => onItemCheckedChange(item, newChecked)}
				>
					{#snippet topRight()}
						{#if itemsLayout.value === 'grid'}
							{#if item.meals.length > 0}
								<div class="flex gap-0.5">
									{#if item.meals.length > 1}
										<span>{item.meals.length}</span>
									{/if}
									<ChefHat class="size-3 mt-[1.2px]" />
								</div>
							{/if}

							{#if item.items.filter((i) => i.type === 'independent').length > 0}
								<div class="flex gap-0.5">
									{#if item.items.filter((i) => i.type === 'independent').length > 1}
										<span>
											{item.items.filter((i) => i.type === 'independent').length}
										</span>
										<Users class="size-3 mt-[1.5px]" />
									{:else}
										<User class="size-3 mt-[1.5px]" />
									{/if}
								</div>
							{/if}
						{/if}
					{/snippet}

					{#if itemsLayout.value === 'list'}
						<span class="text-xs text-muted-foreground/80 flex gap-3">
							<!-- <div class="flex items-center gap-1">
								<House class="size-3 inline-block" />
								None
							</div> -->

							<div class="flex items-center gap-1">
								<Calendar class="size-3 inline-block" />
								{formatCombinedItemQuantity(item) || 'Any'}
							</div>

							{#if item.meals.length > 0}
								<div class="flex items-center gap-1">
									<ChefHat class="size-3 inline-block" />
									{item.meals.length}
								</div>
							{/if}

							{#if item.items.filter((i) => i.type === 'independent').length > 0}
								<div class="flex items-center gap-1">
									<User class="size-3 inline-block" />
									{item.items.filter((i) => i.type === 'independent').length}
								</div>
							{/if}
						</span>
					{/if}
				</ShoppingItemCard>
			</div>
		{/each}
	</div>
{/snippet}
