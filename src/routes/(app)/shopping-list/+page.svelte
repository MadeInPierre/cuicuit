<script lang="ts">
	import {
		type MealWithRecipeAndIngredients,
		type ShoppingIngredient
	} from '$lib/features/plans/queries/get-plan-meals';
	import IngredientListItem from '$lib/features/recipes/components/IngredientListItem.svelte';
	import type { IngredientWithTranslations } from '$lib/features/recipes/queries/get-recipe-detailed';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { Separator } from '$lib/shared/components/ui/separator';
	import NumberFlow from '@number-flow/svelte';
	import * as Tabs from '$lib/shared/components/ui/tabs/index.js';
	import PaperBoard from './PaperBoard.svelte';
	import { supermarketAisleSectionHeaders } from '$lib/features/recipes/components/consts';
	import SectionHeader from '$lib/shared/components/SectionHeader.svelte';
	import { hoveredMealIngredientId } from '$lib/features/plans/state/hovered-meal-ingredient.svelte';
	import {
		Calendar,
		ChefHat,
		Circle,
		CircleCheck,
		CircleCheckBig,
		House,
		ShoppingCart
	} from 'lucide-svelte';
	import MealCard from '$lib/features/plans/components/MealCard.svelte';
	import Button from '$lib/shared/components/ui/button/button.svelte';

	// TODO refactor

	type ShoppingListItem = {
		ingredient: IngredientWithTranslations;
		origins: {
			type: 'meal';
			id: string; // Meal ID, TODO could also be raw ingredient ID or household item ID
			shoppingIngredient: ShoppingIngredient;
		}[];
		mergedQuantity: {
			amount: number;
			unit: string;
		} | null; // null if could not be merged (e.g. weight/volume mismatch)
	};

	const activeSpace = getActiveSpaceState();
	const meals = $derived(activeSpace.activePlan || []);

	const shoppingList: ShoppingListItem[] = $derived(generateShoppingList(meals));

	let hoveredListIngredientId: string | null = $state(null);

	/**
	 * Combines ingredients from meals into a single list with unique ingredients,
	 * summing their quantities and keeping track of their origins.
	 * (e.g., "12 apples coming from 3 for Meal 1, 5 for Meal 2, and 4 by Pierre").
	 */
	function generateShoppingList(meals: MealWithRecipeAndIngredients[]): ShoppingListItem[] {
		const ingredientMap: Record<string, ShoppingListItem> = {};

		meals.forEach((meal) => {
			meal.shopping_ingredients.forEach((shoppingIngredient) => {
				const key = shoppingIngredient.ingredient_id;
				if (!key) return;

				if (!ingredientMap[key]) {
					ingredientMap[key] = {
						ingredient: shoppingIngredient.ingredient!, // TODO ! correct?
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

	<!-- Tab to select the shopping list view -->
	<Tabs.Root value="aisle">
		<Tabs.List>
			<Tabs.Trigger value="aisle">By Aisle</Tabs.Trigger>
			<Tabs.Trigger value="recipes">By Recipe</Tabs.Trigger>
			<!-- <Tabs.Trigger value="combined">Combined</Tabs.Trigger> -->
		</Tabs.List>

		<Tabs.Content value="aisle" class="mt-8">
			<div class="grid grid-cols-1 md:grid-cols-[3fr_0.1fr_1fr]">
				<div class="grid space-y-12">
					{#each Object.entries(supermarketAisleSectionHeaders) as [aisleKey, aisleHeader] (aisleKey)}
						{@const aisleItems = shoppingList.filter((item) => item.ingredient.aisle === aisleKey)}

						{#if aisleItems.length > 0}
							<section>
								<SectionHeader header={aisleHeader} size="sm" class="mb-4" />

								<div
									class="grid grid-cols-1 md:grid-cols-2 ml-5 pl-6 md:pl-12 space-y-4 border-l-2 gap-4"
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
											<IngredientListItem
												ingredient={item.ingredient}
												amount={item.mergedQuantity!.amount}
												unit={item.mergedQuantity!.unit}
											>
												<span class="md:hidden text-xs text-muted-foreground/80 flex gap-3">
													<div class="flex items-center gap-1">
														<House class="size-3 inline-block" />
														400 ml
													</div>

													{#if item.origins.length > 0}
														<div class="flex items-center gap-1">
															<ChefHat class="size-3 inline-block" />
															{item.origins.length}
														</div>
													{/if}
												</span>

												<div class="hidden md:grid">
													{#each item.origins as origin (origin.id)}
														{@const meal = meals.find((m) => m.id === origin.id)}

														<span class="text-xs text-muted-foreground line-clamp-1">
															{#if item.origins.length > 1}
																<NumberFlow value={origin.shoppingIngredient.quantity} />
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
											</IngredientListItem>

											<Button
												size="default"
												variant="ghost"
												class="mt-1 ml-auto w-8 h-8 rounded-full"
											>
												<Circle class="w-8 h-8 text-muted-foreground/60" />
											</Button>
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
									<IngredientListItem
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

				<Separator orientation="vertical" class="mx-4 hidden md:block" />

				<!-- Show all meal origins of the hovered list ingredient -->
				<div class="hidden md:block">
					<div class="grid space-y-4">
						{#each shoppingList.find((item) => item.ingredient.id === hoveredListIngredientId)?.origins || [] as origin (origin.type + origin.id)}
							{@const meal = meals.find((m) => m.id === origin.id)}
							<MealCard {meal} expanded />
						{/each}
					</div>
				</div>
			</div>
		</Tabs.Content>

		<Tabs.Content value="recipes" class="mt-4">
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4 space-y-4 overflow-auto">
				{#each meals as meal (meal.id)}
					<div class="w-full">
						<MealCard {meal} expanded />
					</div>
				{/each}
			</div>

			<!-- <PaperBoard /> -->
		</Tabs.Content>

		<Tabs.Content value="combined" class="mt-4">
			<p>
				TODO This view aims to show a combination variant of the two other "Group by Recipe" and
				"Group by Aisle" views.
			</p>
			<p>
				It should display the shopping list items grouped by aisle, and display a carousel of
				recipes on the top.
			</p>
			<p>
				When the user clicks on a recipe, it should filter the shopping list to show only the
				ingredients needed for that recipe.
			</p>
			<p>
				It also shows recipe ingredients that have been ignored, or not on the list because the
				pantry is already stocked.
			</p>
		</Tabs.Content>
	</Tabs.Root>
</div>
