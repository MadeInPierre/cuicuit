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

		return Object.values(ingredientMap);
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

	<div class="grid space-y-12">
		{#each aisles as a (a.aisle)}
			{@const aisleItems = shoppingList.filter((item) => item.ingredient.aisle === a.aisle)}

			{#if aisleItems.length > 0}
				<section>
					<h3 class="text-lg font-semibold mb-2">{a.aisle}</h3>
					<div class="grid gap-2 ml-8">
						{#each aisleItems as item (item.ingredient.id)}
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
</div>
