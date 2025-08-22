<script lang="ts">
	import {
		type MealWithRecipeAndIngredients,
		type ShoppingIngredient
	} from '$lib/features/plans/queries/get-plan-meals';
	import IngredientListItem from '$lib/features/recipes/components/IngredientListItem.svelte';
	import type { IngredientWithTranslations } from '$lib/features/recipes/queries/get-recipe-detailed';
	import { getSupermarketAisles } from '$lib/features/recipes/queries/get-supermarket-aisles';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { Separator } from '$lib/shared/components/ui/separator';
	import type { Tables } from '$lib/shared/db/supabase.types';
	import NumberFlow from '@number-flow/svelte';
	import { onMount } from 'svelte';
	import * as Tabs from '$lib/shared/components/ui/tabs/index.js';
	import PaperBoard from './PaperBoard.svelte';
	import { supermarketAisleSectionHeaders } from '$lib/features/recipes/components/consts';
	import SectionHeader from '$lib/shared/components/SectionHeader.svelte';
	import { hoveredMealIngredientId } from '$lib/features/plans/state/hovered-meal-ingredient.svelte';
	import { Calendar, House, ShoppingCart } from 'lucide-svelte';
	import MealCard from '$lib/features/plans/components/MealCard.svelte';

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
	 * (e.g., "12 apples coming from 3 for Meal 1, 9 for Meal 2").
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

				// TODO Merge quantities (simple sum, assumes same unit)
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

	let aisles: Tables<'supermarket_aisles'>[] = $state([]);

	onMount(() => {
		// Fetch aisles from the database
		getSupermarketAisles().then((response) => {
			aisles = response.data || [];
		});
	});
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
			<div class="grid grid-cols-[3fr_0.1fr_1fr]">
				<div class="grid space-y-12">
					{#each aisles as a (a.aisle)}
						{@const aisleItems = shoppingList.filter((item) => item.ingredient.aisle === a.aisle)}
						{@const header =
							supermarketAisleSectionHeaders[
								a.aisle as keyof typeof supermarketAisleSectionHeaders
							]}

						{#if aisleItems.length > 0}
							<section>
								<SectionHeader {header} size="sm" class="mb-4" />
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div class="grid ml-5 border-l-2 pl-4 space-y-2">
									{#each aisleItems as item (item.ingredient.id)}
										<div
											class="grid"
											onmouseenter={() => {
												hoveredMealIngredientId.value = item.ingredient.id;
												hoveredListIngredientId = item.ingredient.id;
											}}
											onmouseleave={() => {
												hoveredMealIngredientId.value = null;
												hoveredListIngredientId = null;
											}}
										>
											<div class="flex items-center gap-8 mr-8">
												<IngredientListItem
													ingredient={item.ingredient}
													amount={item.mergedQuantity!.amount}
													unit={item.mergedQuantity!.unit}
												/>

												<div class="ml-auto w-28 flex items-center gap-2 text-sm">
													<House class="size-5" />
													<span>
														<strong>
															<NumberFlow value={item.mergedQuantity!.amount} />
														</strong>
														{item.mergedQuantity!.unit?.replace('whole', '')}
													</span>
												</div>

												<div class="w-28 flex items-center gap-2 text-sm">
													<Calendar class="size-5" />
													<span>
														<strong>
															<NumberFlow value={item.mergedQuantity!.amount} />
														</strong>
														{item.mergedQuantity!.unit?.replace('whole', '')}
													</span>
												</div>

												<div class="w-28 flex items-center gap-2 text-sm">
													<ShoppingCart class="size-5" />
													<span>
														<strong>
															<NumberFlow value={item.mergedQuantity!.amount} />
														</strong>
														{item.mergedQuantity!.unit?.replace('whole', '')}
													</span>
												</div>
											</div>

											<!-- <div class="grid">
											{#each item.origins as origin (origin.id)}
												{@const meal = meals.find((m) => m.id === origin.id)}

												<MealCard {meal} expanded />
												<span class="ml-8 text-xs text-muted-foreground">
													<NumberFlow value={origin.shoppingIngredient.quantity} />
													{origin.shoppingIngredient.unit} from {origin.type}
													{meal ? meal.recipe.title : origin.id}
												</span>
											{/each}
										</div> -->
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

				<Separator orientation="vertical" class="mx-4" />

				<!-- Show all meal origins of the hovered list ingredient -->
				<div class="">
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
			<PaperBoard />
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
