<script lang="ts">
	import {
		type MealWithRecipeAndIngredients,
		type ShoppingIngredient
	} from '$lib/features/plans/queries/get-plan-meals';
	import ShoppingListItem from '$lib/features/recipes/components/ShoppingListItem.svelte';
	import type { RecipeIngredientWithTranslations } from '$lib/features/recipes/queries/get-recipe-detailed';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { Separator } from '$lib/shared/components/ui/separator';
	import NumberFlow from '@number-flow/svelte';
	import * as Tabs from '$lib/shared/components/ui/tabs/index.js';
	import { supermarketAisleSectionHeaders } from '$lib/features/recipes/components/consts';
	import SectionHeader from '$lib/shared/components/SectionHeader.svelte';
	import { hoveredMealIngredientId } from '$lib/features/plans/state/hovered-meal-ingredient.svelte';
	import { Calendar, ChefHat, House, User } from 'lucide-svelte';
	import MealCard from '$lib/features/plans/components/MealListItem.svelte';
	import RecipeCarousel from '../recipes/RecipeCarousel.svelte';

	type ShoppingListItem = {
		ingredient: RecipeIngredientWithTranslations;
		origins: {
			type: 'meal' | 'independent';
			id: string; // Meal ID, TODO could also be raw ingredient ID or household item ID
			shoppingIngredient: ShoppingIngredient;
		}[];
		mergedQuantity: {
			amount: number;
			unit: string;
		} | null; // null if could not be merged (e.g. weight/volume mismatch)
	};

	const activeSpace = getActiveSpaceState();
	const meals = $derived(activeSpace.activePlanMeals || []);
	const items = $derived(activeSpace.activePlanItems || []);

	const shoppingList: ShoppingListItem[] = $derived(generateShoppingList(meals, items));

	let hoveredListIngredientId: string | null = $state(null);

	/**
	 * Combines ingredients from meals into a single list with unique ingredients,
	 * summing their quantities and keeping track of their origins.
	 * (e.g., "12 apples coming from 3 for Meal 1, 5 for Meal 2, and 4 by Pierre").
	 */
	function generateShoppingList(
		meals: MealWithRecipeAndIngredients[],
		items: ShoppingIngredient[]
	): ShoppingListItem[] {
		const ingredientMap: Record<string, ShoppingListItem> = {};

		// Process meals first to populate the ingredient map with recipe ingredients and their origins
		meals.forEach((meal) => {
			meal.shopping_ingredients.forEach((shoppingIngredient) => {
				const key = shoppingIngredient.ingredient_id;
				if (!key) return;

				if (!ingredientMap[key]) {
					ingredientMap[key] = {
						ingredient: shoppingIngredient.ingredient!, // TODO ! incorrect with unknown shopping items added by the user
						origins: [],
						mergedQuantity: {
							amount: 0,
							unit: shoppingIngredient.unit || ''
						}
					};
				}

				ingredientMap[key].origins.push({
					type: 'meal',
					id: meal.id,
					shoppingIngredient: {
						...shoppingIngredient,
						quantity: (shoppingIngredient.quantity * meal.servings) / meal.recipe.servings
					}
				});

				// TODO Merge quantities (simple sum, assumes same unit for now, but should handle unit conversions and weight/volume mismatches)
				ingredientMap[key].mergedQuantity!.amount +=
					(shoppingIngredient.quantity * meal.servings) / meal.recipe.servings;
				ingredientMap[key].mergedQuantity!.unit =
					shoppingIngredient.unit || ingredientMap[key].mergedQuantity!.unit;
			});
		});

		// Then process independent shopping items, adding them to the map or merging with existing ingredients
		items.forEach((shoppingItem) => {
			const key = shoppingItem.ingredient_id;
			if (!key) return;

			if (!ingredientMap[key]) {
				ingredientMap[key] = {
					ingredient: shoppingItem.ingredient!, // TODO handle unknown/manual items without ingredient relation
					origins: [],
					mergedQuantity: {
						amount: 0,
						unit: shoppingItem.unit || ''
					}
				};
			}

			ingredientMap[key].origins.push({
				type: 'independent',
				id: shoppingItem.id,
				shoppingIngredient: shoppingItem
			});

			if (ingredientMap[key].mergedQuantity) {
				ingredientMap[key].mergedQuantity.amount += shoppingItem.quantity;
				ingredientMap[key].mergedQuantity.unit =
					shoppingItem.unit || ingredientMap[key].mergedQuantity.unit;
			}
		});

		return Object.values(ingredientMap).sort((a, b) =>
			a.ingredient.slug.localeCompare(b.ingredient.slug)
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
		<Tabs.List>
			<Tabs.Trigger value="aisle">By Aisle</Tabs.Trigger>
			<Tabs.Trigger value="recipe">By Recipe</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="aisle" class="mt-8">
			<h3 class="text-xl font-semibold mb-6">Planned meals</h3>

			<RecipeCarousel recipes={meals.map((meal) => meal.recipe)} />

			<h3 class="mt-6 text-xl font-semibold mb-6">Shopping list</h3>

			<div class="grid grid-cols-1">
				<div class="grid space-y-12">
					{#each Object.entries(supermarketAisleSectionHeaders) as [aisleKey, aisleHeader] (aisleKey)}
						{@const aisleItems = shoppingList.filter((item) => item.ingredient.aisle === aisleKey)}

						{#if aisleItems.length > 0}
							<section>
								<SectionHeader header={aisleHeader} size="sm" class="mb-4" />

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
											<ShoppingListItem
												ingredient={item.ingredient}
												amount={item.mergedQuantity!.amount}
												unit={item.mergedQuantity!.unit}
											>
												<span class="text-xs text-muted-foreground/80 flex gap-3">
													<div class="flex items-center gap-1">
														<House class="size-3 inline-block" />
														None
													</div>

													<div class="flex items-center gap-1">
														<Calendar class="size-3 inline-block" />
														600 ml
													</div>

													{#if item.origins.some((origin) => origin.type === 'meal')}
														<div class="flex items-center gap-1">
															<ChefHat class="size-3 inline-block" />
															{item.origins.filter((origin) => origin.type === 'meal').length}
														</div>
													{/if}

													{#if item.origins.some((origin) => origin.type === 'independent')}
														<div class="flex items-center gap-1">
															<User class="size-3 inline-block" />
															{item.origins.filter((origin) => origin.type === 'independent')
																.length}
														</div>
													{/if}
												</span>

												<div class="hidden">
													{#each item.origins as origin (origin.id)}
														{@const meal = meals.find((m) => m.id === origin.id)}

														<span class="text-xs text-muted-foreground line-clamp-1">
															<ChefHat class="size-3 inline-block" />

															{#if item.origins.length > 1}
																{origin.shoppingIngredient.quantity}
																{origin.shoppingIngredient.unit === 'whole'
																	? ''
																	: origin.shoppingIngredient.unit}
																for
															{/if}
															{meal ? meal.recipe.title : origin.id}
														</span>
													{/each}
												</div>

												<!-- <div class="grid grid-cols-1 gap-3 mt-2">
													{#each item.origins as origin (origin.id)}
														{@const meal = meals.find((m) => m.id === origin.id)}
														<MealCard {meal} showServings={false} class="border-none p-0 " />
													{/each}
												</div> -->
											</ShoppingListItem>
										</div>
									{/each}
								</div>
							</section>
						{/if}
					{/each}

					{#if shoppingList.some((item) => !item.ingredient.aisle)}
						<section class="mb-8">
							<h3 class="text-lg font-semibold mb-2">Other</h3>
							<div class="grid gap-2">
								{#each shoppingList.filter((item) => !item.ingredient.aisle) as item (item.ingredient.id)}
									<ShoppingListItem
										ingredient={item.ingredient}
										amount={item.mergedQuantity!.amount}
										unit={item.mergedQuantity!.unit}
									/>

									{#each item.origins as origin (origin.id)}
										{@const meal = meals.find((m) => m.id === origin.id)}
										<span class="ml-8 text-xs text-muted-foreground">
											<NumberFlow value={origin.shoppingIngredient.quantity} />
											{origin.shoppingIngredient.unit} from {origin.type}
											{meal ? meal.recipe.title : origin.id}
										</span>
									{/each}
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
