<script lang="ts">
	import {
		type MealWithRecipeAndIngredients,
		type ShoppingIngredient
	} from '$lib/features/plans/queries/get-plan-meals';
	import ShoppingItemCardList from '$lib/features/recipes/components/ShoppingItemCardList.svelte';
	import type { RecipeIngredientWithTranslations } from '$lib/features/recipes/queries/get-recipe-detailed';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { Separator } from '$lib/shared/components/ui/separator';
	import * as Tabs from '$lib/shared/components/ui/tabs/index.js';
	import { supermarketAisleSectionHeaders } from '$lib/features/recipes/components/consts';
	import SectionHeader from '$lib/shared/components/SectionHeader.svelte';
	import { hoveredMealIngredientId } from '$lib/features/plans/state/hovered-meal-ingredient.svelte';
	import {
		Check,
		ChefHat,
		Ellipsis,
		Grid3x3,
		Lightbulb,
		List,
		Plus,
		RefreshCcw,
		RotateCcw,
		Shuffle,
		User,
		Users
	} from 'lucide-svelte';
	import MealCard from '$lib/features/plans/components/MealListItem.svelte';
	import RecipeCarousel from '../recipes/RecipeCarousel.svelte';
	import ShoppingItemCardGrid from '$lib/features/recipes/components/ShoppingItemCardGrid.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { createPersistentState } from '$lib/shared/state/create-persistent-state.svelte';
	import { cn } from '$lib/utils';
	import { deletePlanItem, updatePlanItemChecked } from '$lib/features/plans/actions/update-item';
	import type { ShoppingListItem } from '$lib/features/plans/queries/get-plan-items';
	import { flip } from 'svelte/animate';
	import ShoppingItemBadge from '$lib/features/recipes/components/ShoppingItemBadge.svelte';
	import SearchShoppingItemBar from '$lib/shared/components/SearchShoppingItemBar.svelte';
	import { onMount } from 'svelte';
	import {
		getShoppingRecommendations,
		type ShoppingRecommendation
	} from '$lib/features/spaces/queries/get-shopping-recommendations';
	import { addShoppingItem } from '$lib/features/plans/actions/add-shopping-item';

	type CombinedShoppingListItem = {
		name: string;
		ingredient: RecipeIngredientWithTranslations | null; // null for manual items
		items: ShoppingListItem[];
		meals: MealWithRecipeAndIngredients[];
		mergedQuantity: {
			amount: number;
			unit: string;
		};
	};

	const activeSpace = getActiveSpaceState();
	const meals = $derived(activeSpace.activePlanMeals || []);
	const items = $derived(activeSpace.activePlanItems || []);

	const shoppingList: CombinedShoppingListItem[] = $derived(generateShoppingList(meals, items));
	const hasCheckedItems = $derived(items.some((item) => item.checked_at));

	let hoveredListIngredientId: string | null = $state(null);

	let itemsLayout = createPersistentState<'grid' | 'list'>(
		'view-shopping-list-items-layout',
		'list'
	);

	/**
	 * Combines ingredients from meals and user-added items into a single list with unique ingredients,
	 * summing their quantities and keeping track of their origins.
	 * (e.g., "12 apples coming from 3 for Meal 1, 5 for Meal 2, and 4 by Pierre").
	 */
	function generateShoppingList(
		meals: MealWithRecipeAndIngredients[],
		items: ShoppingIngredient[]
	): CombinedShoppingListItem[] {
		const ingredientMap: Record<string, CombinedShoppingListItem> = {};

		// Merge all shopping items by ingredient id
		items.forEach((shoppingItem) => {
			// Use ingredient_id for items linked to an ingredient, otherwise fallback to item id for manual/unknown items
			const key = shoppingItem.ingredient_id || shoppingItem.name?.toLowerCase() || shoppingItem.id;
			if (!key) return;

			// If this ingredient is not in the map yet, create an entry for it
			if (!ingredientMap[key]) {
				ingredientMap[key] = {
					name: shoppingItem.name || 'Unknown',
					ingredient: shoppingItem.ingredient || null,
					items: [],
					meals: [],
					mergedQuantity: {
						amount: 0,
						unit: shoppingItem.unit || ''
					}
				};
			}

			// Push this item
			ingredientMap[key].items.push(shoppingItem);

			// TODO Merge quantities
			if (shoppingItem.quantity) {
				ingredientMap[key].mergedQuantity.amount += shoppingItem.quantity;
				ingredientMap[key].mergedQuantity.unit =
					shoppingItem.unit || ingredientMap[key].mergedQuantity.unit;
			}
		});

		// Process meals first to populate the ingredient map with recipe ingredients and their origins
		meals.forEach((meal) => {
			meal.shopping_ingredients.forEach((shoppingIngredient) => {
				const key =
					shoppingIngredient.ingredient_id ||
					shoppingIngredient.name?.toLowerCase() ||
					shoppingIngredient.id;
				if (!key) return;

				// Ignore deleted items
				if (shoppingIngredient.deleted_at) return;

				if (!ingredientMap[key]) {
					ingredientMap[key] = {
						name: shoppingIngredient.name || 'Unknown',
						ingredient: shoppingIngredient.ingredient || null,
						items: [],
						meals: [],
						mergedQuantity: {
							amount: 0,
							unit: shoppingIngredient.unit || ''
						}
					};
				}

				// Push this meal as an origin and the shopping item
				if (!ingredientMap[key].meals.some((m) => m.id === meal.id)) {
					ingredientMap[key].meals.push(meal);
				}
			});
		});

		return Object.values(ingredientMap).sort((a, b) => {
			const aChecked = a.items.some((si) => si.checked_at);
			const bChecked = b.items.some((si) => si.checked_at);

			// Keep unchecked items first
			if (aChecked !== bChecked) {
				return Number(aChecked) - Number(bChecked);
			}

			const aSlug = a.ingredient?.slug || a.name;
			const bSlug = b.ingredient?.slug || b.name;

			// Only reverse order within checked items
			if (aChecked && bChecked) {
				return bSlug.localeCompare(aSlug);
			}

			// Keep normal order within unchecked items
			return aSlug.localeCompare(bSlug);
		});
	}

	/** Update an item from all its origins at once */
	async function onItemCheckedChange(shoppingItem: CombinedShoppingListItem, newChecked: boolean) {
		console.log('Changing checked state of', shoppingItem, 'to', newChecked);
		const originIdsToUpdate = shoppingItem.items.map((si) => si.id);
		await Promise.all(
			originIdsToUpdate.map((id) => updatePlanItemChecked(activeSpace, id, newChecked))
		);
	}

	let rawShoppingRecommendations: ShoppingRecommendation[] = $state([]);
	let recentRecommendations: ShoppingRecommendation[] = $state([]);

	async function refreshRecommendations() {
		if (!activeSpace.id) return;
		const recommendations = await getShoppingRecommendations(activeSpace.id);
		rawShoppingRecommendations = recommendations;
	}

	// Keep recommendations that are not already in the shopping list or recently recommended
	let shoppingRecommendations = $derived(
		rawShoppingRecommendations.filter(
			(rec) =>
				!shoppingList.some((item) => item.ingredient?.id === rec.ingredient_id) &&
				!recentRecommendations.some((recent) => recent.ingredient_id === rec.ingredient_id)
		)
	);

	onMount(refreshRecommendations);
</script>

<div class="space-y-6 pb-16 min-h-full">
	<div class="flex items-center">
		<div class="space-y-0.5">
			<h2 class="text-2xl font-bold tracking-tight">Shopping list</h2>
			<p class="text-muted-foreground">Here is your plan neatly organized by market aisle.</p>
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

			{#if hasCheckedItems}
				<Button
					variant="default"
					class="ml-auto"
					onclick={async () => {
						// TODO confirm with user if they want to clear the whole list, or just the checked items?
						items.forEach((item) => {
							if (item.checked_at) deletePlanItem(activeSpace, item.id);
						});

						await activeSpace.refreshActivePlanItems();
						await activeSpace.refreshActivePlanMeals();
						await refreshRecommendations();
					}}
				>
					<Check class="size-4 mr-2" />
					End shopping
				</Button>
			{/if}
		</div>

		<Tabs.Content value="aisle" class="mt-8">
			<!-- <h3 class="text-xl font-semibold mb-6">Planned meals</h3> -->

			<!-- <RecipeCarousel recipes={meals.map((meal) => meal.recipe)} /> -->

			<!-- <h3 class="mt-6 text-xl font-semibold mb-6">Shopping list</h3> -->

			<div class="grid grid-cols-1">
				<div class={cn('grid space-y-4', itemsLayout.value === 'list' && 'space-y-12')}>
					{#each Object.entries(supermarketAisleSectionHeaders) as [aisleKey, aisleHeader] (aisleKey)}
						{@const aisleItems = shoppingList.filter(
							(item) => (item.ingredient?.aisle || 'default') === aisleKey
						)}

						{@const aisleRecommendations = shoppingRecommendations
							.filter((rec) => rec.aisle === aisleKey)
							.slice(0, 4)}

						{#if aisleItems.length > 0}
							<section class="mb-16">
								<div class="mb-4 flex items-center justify-between">
									<SectionHeader header={aisleHeader} size="sm" class="" />

									{#if aisleRecommendations.length > 0}
										<div class="hidden lg:flex items-center group">
											<Button
												variant="ghost"
												size="icon"
												class="text-muted-foreground group-hover:mr-2"
												onclick={() => {
													// Don't show the same recommendations again on shuffle
													recentRecommendations = [
														...aisleRecommendations,
														...recentRecommendations
													].slice(0, 100);

													refreshRecommendations();
												}}
											>
												{#if typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0}
													<Shuffle class="size-4" />
												{:else}
													<Plus class="size-4 group-hover:hidden" />
													<Shuffle class="size-4 hidden group-hover:block" />
												{/if}
											</Button>

											{#each aisleRecommendations as rec, index (rec.ingredient_id)}
												<div animate:flip={{ duration: 300 }}>
													<ShoppingItemBadge
														ingredientId={rec.ingredient_id}
														name={rec.name}
														score={`Bought ${rec.score} time${rec.score > 1 ? 's' : ''}`}
														class={index > 0 ? 'ml-2' : ''}
														onclick={async () => {
															await addShoppingItem(activeSpace, rec.ingredient_id, rec.name);
														}}
													></ShoppingItemBadge>
												</div>
											{/each}
										</div>
									{/if}
								</div>

								<div class="grid space-y-4 md:ml-5 md:pl-8 lg:pl-12 md:border-l-2">
									<div class="relative lg:hidden overflow-hidden">
										<div
											class="flex items-center gap-2 pr-4 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
										>
											<span class="text-sm font-medium text-muted-foreground italic shrink-0">
												<Lightbulb class="size-4" />
											</span>

											{#each aisleRecommendations.slice(0, 10) as rec (rec.ingredient_id)}
												<div class="shrink-0 py-0.5">
													<ShoppingItemBadge
														ingredientId={rec.ingredient_id}
														name={rec.name}
														score={`Bought ${rec.score} time${rec.score > 1 ? 's' : ''}`}
														onclick={async () => {
															await addShoppingItem(activeSpace, rec.ingredient_id, rec.name);
														}}
													></ShoppingItemBadge>
												</div>
											{/each}

											{#if aisleItems.length > 10}
												<Button variant="link">
													<Ellipsis class="size-4" />
													More
												</Button>
											{/if}
										</div>

										<div
											class="pointer-events-none absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-background to-transparent"
										></div>
									</div>

									{#if itemsLayout.value === 'grid'}
										<div
											class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2"
										>
											{#each aisleItems as item (item.ingredient?.id || item.name)}
												<!-- svelte-ignore a11y_no_static_element_interactions -->
												<div
													class="flex group"
													animate:flip={{ duration: 300 }}
													onmouseenter={() => {
														if (!item.ingredient) return; // No hover state for manual items
														hoveredMealIngredientId.value = item.ingredient.id;
														hoveredListIngredientId = item.ingredient.id;
													}}
													onmouseleave={() => {
														hoveredMealIngredientId.value = null;
														hoveredListIngredientId = null;
													}}
												>
													<ShoppingItemCardGrid
														ingredient={item.ingredient}
														description={item.name}
														amount={item.mergedQuantity?.amount}
														unit={item.mergedQuantity?.unit}
														class=""
														size="md"
														checkable
														checked={item.items.some((si) => si.checked_at)}
														onCheckedChange={(newChecked) => onItemCheckedChange(item, newChecked)}
													>
														{#snippet topRight()}
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
														{/snippet}
													</ShoppingItemCardGrid>
												</div>
											{/each}
										</div>
									{:else}
										<div class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-2 md:gap-4">
											{#each aisleItems as item (item.ingredient?.id || item.name)}
												<!-- svelte-ignore a11y_no_static_element_interactions -->
												<div
													class="flex group"
													animate:flip={{ duration: 300 }}
													onmouseenter={() => {
														if (!item.ingredient) return; // No hover state for manual items
														hoveredMealIngredientId.value = item.ingredient.id;
														hoveredListIngredientId = item.ingredient.id;
													}}
													onmouseleave={() => {
														hoveredMealIngredientId.value = null;
														hoveredListIngredientId = null;
													}}
												>
													<ShoppingItemCardList
														ingredient={item.ingredient}
														description={item.name}
														amount={item.mergedQuantity!.amount}
														unit={item.mergedQuantity!.unit}
														checkable
														checked={item.items.some((si) => si.checked_at)}
														onCheckedChange={(newChecked) => onItemCheckedChange(item, newChecked)}
													>
														<span class="text-xs text-muted-foreground/80 flex gap-3">
															<!-- <div class="flex items-center gap-1">
														<House class="size-3 inline-block" />
														None
													</div> -->

															<!-- <div class="flex items-center gap-1">
														<Calendar class="size-3 inline-block" />
														600 ml
													</div> -->

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

														<!-- <div class="grid grid-cols-1 gap-3 mt-2">
														{#each item.origins as origin (origin.id)}
															{@const meal = meals.find((m) => m.id === origin.id)}
															<MealCard {meal} showServings={false} class="border-none p-0 " />
														{/each}
													</div> -->
													</ShoppingItemCardList>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							</section>
						{/if}
					{/each}

					<!-- {#if shoppingList.some((item) => !item.ingredient.aisle)}
						<section class="mb-8">
							<h3 class="text-lg font-semibold mb-2">Other</h3>
							<div class="grid gap-2">
								{#each shoppingList.filter((item) => !item.ingredient.aisle) as item (item.ingredient.id)}
									<ShoppingItemCardList
										ingredient={item.ingredient}
										amount={item.mergedQuantity!.amount}
										unit={item.mergedQuantity!.unit}
									/>
								{/each}
							</div>
						</section>
					{/if} -->
				</div>

				<!-- <Separator orientation="vertical" class="mx-4 hidden md:block" />
				<div class="hidden md:block">
					<div class="grid space-y-4">
						{#each shoppingList.find((item) => item.ingredient.id === hoveredListIngredientId)?.origins || [] as origin (origin.type + origin.id)}
							{@const meal = meals.find((m) => m.id === origin.id)}
							<MealCard {meal} expanded />
						{/each}
					</div>
				</div> -->
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
