import type { ShoppingListItem } from '$lib/features/plans/queries/get-plan-items';
import type {
	MealWithRecipeAndIngredients,
	ShoppingIngredient
} from '$lib/features/plans/queries/get-plan-meals';
import type { RecipeIngredientWithTranslations } from '$lib/features/recipes/queries/get-recipe-detailed';

export type CombinedShoppingListItem = {
	name: string;
	ingredient: RecipeIngredientWithTranslations | null; // null for manual items
	items: ShoppingListItem[];
	meals: MealWithRecipeAndIngredients[];
	mergedQuantity: {
		withOptionals: {
			[unit: string]: number; // Map of unit to total amount (e.g., { "g": 500, "cup": 2 })
		};
		requiredOnly: {
			[unit: string]: number; // Map of unit to total amount for required items only
		};
	};
};

/**
 * Combines ingredients from meals and user-added items into a single list with unique ingredients,
 * summing their quantities and keeping track of their origins.
 * (e.g., "12 apples coming from 3 for Meal 1, 5 for Meal 2, and 4 by Pierre").
 */
export function generateShoppingList(
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
					withOptionals: {},
					requiredOnly: {}
				}
			};
		}

		// Push this item
		ingredientMap[key].items.push(shoppingItem);

		// TODO Merge quantities
		if (shoppingItem.quantity) {
			const isOptional = shoppingItem.priority === 'optional';
			const unitKey = shoppingItem.unit?.trim() || '';

			ingredientMap[key].mergedQuantity.withOptionals[unitKey] =
				(ingredientMap[key].mergedQuantity.withOptionals[unitKey] || 0) + shoppingItem.quantity;

			if (!isOptional) {
				ingredientMap[key].mergedQuantity.requiredOnly[unitKey] =
					(ingredientMap[key].mergedQuantity.requiredOnly[unitKey] || 0) + shoppingItem.quantity;
			}
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
						withOptionals: {},
						requiredOnly: {}
					}
				};
			}

			// Push this meal as an origin and the shopping item
			ingredientMap[key].meals.push(meal);
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
