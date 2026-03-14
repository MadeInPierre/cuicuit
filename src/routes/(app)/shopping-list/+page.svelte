<script lang="ts">
	import {
		type MealWithRecipeAndIngredients,
		type ShoppingIngredient
	} from '$lib/features/plans/queries/get-plan-meals';
	import ShoppingListListItem from '$lib/features/recipes/components/ShoppingListListItem.svelte';
	import type { RecipeIngredientWithTranslations } from '$lib/features/recipes/queries/get-recipe-detailed';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { Separator } from '$lib/shared/components/ui/separator';
	import * as Tabs from '$lib/shared/components/ui/tabs/index.js';
	import { supermarketAisleSectionHeaders } from '$lib/features/recipes/components/consts';
	import SectionHeader from '$lib/shared/components/SectionHeader.svelte';
	import { hoveredMealIngredientId } from '$lib/features/plans/state/hovered-meal-ingredient.svelte';
	import { ChefHat, Grid3x3, List, User } from 'lucide-svelte';
	import MealCard from '$lib/features/plans/components/MealListItem.svelte';
	import RecipeCarousel from '../recipes/RecipeCarousel.svelte';
	import ShoppingListCard from '$lib/features/recipes/components/ShoppingListCard.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { createPersistentState } from '$lib/shared/state/create-persistent-state.svelte';
	import { cn } from '$lib/utils';
	import { updatePlanItemChecked } from '$lib/features/plans/actions/update-item';
	import type { ShoppingListItem } from '$lib/features/plans/queries/get-plan-items';

	type CombinedShoppingListItem = {
		ingredient: RecipeIngredientWithTranslations;
		items: ShoppingListItem[];
		meals: MealWithRecipeAndIngredients[];
		mergedQuantity: {
			amount: number;
			unit: string;
		}; // TODO maybe null if could not be merged (e.g. weight/volume mismatch)?
	};

	const activeSpace = getActiveSpaceState();
	const meals = $derived(activeSpace.activePlanMeals || []);
	const items = $derived(activeSpace.activePlanItems || []);

	const shoppingList: CombinedShoppingListItem[] = $derived(generateShoppingList(meals, items));

	let hoveredListIngredientId: string | null = $state(null);

	let itemsLayout = createPersistentState<'grid' | 'list'>(
		'view-shopping-list-items-layout',
		'list'
	);

	/**
	 * Combines ingredients from meals into a single list with unique ingredients,
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
			const key = shoppingItem.ingredient_id;
			if (!key) return; // TODO handle manual items without ingredient relation

			// If this ingredient is not in the map yet, create an entry for it
			if (!ingredientMap[key]) {
				ingredientMap[key] = {
					ingredient: shoppingItem.ingredient!, // TODO handle unknown/manual items without ingredient relation
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
			ingredientMap[key].mergedQuantity.amount += shoppingItem.quantity;
			ingredientMap[key].mergedQuantity.unit =
				shoppingItem.unit || ingredientMap[key].mergedQuantity.unit;
		});

		// Process meals first to populate the ingredient map with recipe ingredients and their origins
		meals.forEach((meal) => {
			meal.shopping_ingredients.forEach((shoppingIngredient) => {
				const key = shoppingIngredient.ingredient_id;
				if (!key) return;

				if (!ingredientMap[key]) {
					ingredientMap[key] = {
						ingredient: shoppingIngredient.ingredient!, // TODO handle unknown/manual items without ingredient relation
						items: [],
						meals: [],
						mergedQuantity: {
							amount: 0,
							unit: shoppingIngredient.unit || ''
						}
					};
				}

				// Push this meal as an origin
				ingredientMap[key].meals.push(meal);

				// TODO Merge quantities (simple sum, assumes same unit for now, but should handle unit conversions and weight/volume mismatches)
				ingredientMap[key].mergedQuantity!.amount +=
					(shoppingIngredient.quantity * meal.servings) / meal.recipe.servings;
				ingredientMap[key].mergedQuantity!.unit =
					shoppingIngredient.unit || ingredientMap[key].mergedQuantity!.unit;
			});
		});

		return Object.values(ingredientMap).sort((a, b) =>
			a.ingredient.slug.localeCompare(b.ingredient.slug)
		);
	}

	async function onItemCheckedChange(item: CombinedShoppingListItem, newChecked: boolean) {
		console.log('Checked state changed for', item.ingredient.slug, 'to', newChecked);

		// Update items from all origins for better UX (instead of just the first origin)
		const originIdsToUpdate = item.items.map((si) => si.id);
		await Promise.all(
			originIdsToUpdate.map((id) => updatePlanItemChecked(activeSpace, id, newChecked))
		);
	}
</script>

<div class="space-y-6 pb-16 min-h-full">
	<div class="flex items-center">
		<div class="space-y-0.5">
			<h2 class="text-2xl font-bold tracking-tight">Shopping list</h2>
			<p class="text-muted-foreground">
				Here's your shopping list. Add items or recipes to get started.
			</p>
		</div>
	</div>

	<Separator class="my-6" />

	<Tabs.Root value="aisle">
		<div class="flex justify-between items-center">
			<Tabs.List>
				<Tabs.Trigger value="aisle">By Aisle</Tabs.Trigger>
				<Tabs.Trigger value="recipe">By Recipe</Tabs.Trigger>
			</Tabs.List>

			<!-- <Button
				variant="outline"
				size="sm"
				onclick={() => {
					itemsLayout = itemsLayout === 'grid' ? 'list' : 'grid';
				}}>Switch</Button
			> -->
			<Button
				variant="ghost"
				size="icon"
				class="ml-auto h-7 w-7"
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
		</div>

		<Tabs.Content value="aisle" class="mt-8">
			<h3 class="text-xl font-semibold mb-6">Planned meals</h3>

			<RecipeCarousel recipes={meals.map((meal) => meal.recipe)} />

			<h3 class="mt-6 text-xl font-semibold mb-6">Shopping list</h3>

			<div class="grid grid-cols-1">
				<div class={cn('grid space-y-4', itemsLayout.value === 'list' && 'space-y-12')}>
					{#each Object.entries(supermarketAisleSectionHeaders) as [aisleKey, aisleHeader] (aisleKey)}
						{@const aisleItems = shoppingList.filter((item) => item.ingredient.aisle === aisleKey)}

						{#if aisleItems.length > 0}
							<section>
								<SectionHeader header={aisleHeader} size="sm" class="mb-4" />

								{#if itemsLayout.value === 'grid'}
									<div
										class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 ml-5 pl-6 md:pl-12 border-l-2 gap-2 mb-8"
									>
										{#each aisleItems as item (item.ingredient.id)}
											<!-- svelte-ignore a11y_no_static_element_interactions -->
											<div
												class="flex group"
												onmouseenter={() => {
													hoveredMealIngredientId.value = item.ingredient.id;
													hoveredListIngredientId = item.ingredient.id;
												}}
												onmouseleave={() => {
													hoveredMealIngredientId.value = null;
													hoveredListIngredientId = null;
												}}
											>
												<!--  TODO if merging checked and unchecked items, consider it checked if some are checked, or add a third "partially checked" state? -->
												<ShoppingListCard
													ingredient={item.ingredient}
													amount={item.mergedQuantity!.amount}
													unit={item.mergedQuantity!.unit}
													class=""
													size="md"
													checkable
													checked={item.items.some((si) => si.checked)}
													onCheckedChange={(newChecked) => onItemCheckedChange(item, newChecked)}
												>
													{#snippet topRight()}
														{#if item.meals.length > 0}
															<div class="flex items-start gap-0.5">
																{#if item.meals.length > 1}
																	<span>{item.meals.length}</span>
																{/if}
																<ChefHat class="size-3 mt-[1.25px]" />
															</div>
														{/if}

														{#if item.items.filter((i) => i.type === 'independent').length > 0}
															<div class="flex items-start gap-0.5">
																{#if item.items.filter((i) => i.type === 'independent').length > 1}
																	<span
																		>{item.items.filter((i) => i.type === 'independent')
																			.length}</span
																	>
																{/if}
																<User class="size-3 mt-[1.5px]" />
															</div>
														{/if}
													{/snippet}
												</ShoppingListCard>
											</div>
										{/each}
									</div>
								{:else}
									<div
										class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 ml-5 pl-6 md:pl-12 border-l-2 gap-4"
									>
										{#each aisleItems as item (item.ingredient.id)}
											<!-- svelte-ignore a11y_no_static_element_interactions -->
											<div
												class="flex group"
												onmouseenter={() => {
													hoveredMealIngredientId.value = item.ingredient.id;
													hoveredListIngredientId = item.ingredient.id;
												}}
												onmouseleave={() => {
													hoveredMealIngredientId.value = null;
													hoveredListIngredientId = null;
												}}
											>
												<ShoppingListListItem
													ingredient={item.ingredient}
													amount={item.mergedQuantity!.amount}
													unit={item.mergedQuantity!.unit}
													checkable
													checked={item.items.some((si) => si.checked)}
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
												</ShoppingListListItem>
											</div>
										{/each}
									</div>
								{/if}
							</section>
						{/if}
					{/each}

					{#if shoppingList.some((item) => !item.ingredient.aisle)}
						<section class="mb-8">
							<h3 class="text-lg font-semibold mb-2">Other</h3>
							<div class="grid gap-2">
								{#each shoppingList.filter((item) => !item.ingredient.aisle) as item (item.ingredient.id)}
									<ShoppingListListItem
										ingredient={item.ingredient}
										amount={item.mergedQuantity!.amount}
										unit={item.mergedQuantity!.unit}
									/>
								{/each}
							</div>
						</section>
					{/if}
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
						<MealCard {meal} expanded showExpandedButtons class="border" />
					</div>
				{/each}
			</div>

			<span>
				TODO show not-expanded planned meals that already have all ingredients in the pantry
			</span>
		</Tabs.Content>
	</Tabs.Root>
</div>
