import type { ShoppingListItem } from '$lib/features/plans/queries/get-plan-items';
import type {
	MealWithRecipeAndIngredients,
	ShoppingIngredient
} from '$lib/features/plans/queries/get-plan-meals';
import type { RecipeIngredientWithTranslations } from '$lib/features/recipes/queries/get-recipe-detailed';
import { mergeQuantities } from '$lib/shared/utils/merge-quantities';
import type { UnitRegionized } from '$lib/shared/utils/quantity';

export type CombinedShoppingListItem = {
	name: string;
	ingredient: RecipeIngredientWithTranslations | null; // null for manual items
	items: ShoppingListItem[];
	meals: MealWithRecipeAndIngredients[];
	mergedQuantity: {
		// Map of unit to total amount for that unit, separated into required and optional quantities
		[unit in UnitRegionized]?: {
			withOptionals: number; // Total amount including optional items
			requiredOnly: number; // Total amount for required items only
			optionalOnly: number; // Total amount for optional items only (calculated as withOptionals - requiredOnly)
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
				mergedQuantity: {}
			};
		}

		// Push this item
		ingredientMap[key].items.push(shoppingItem);

		// TODO Merge quantities
		if (shoppingItem.quantity) {
			const isOptional = shoppingItem.priority === 'optional';
			const unitKey = (shoppingItem.unit?.trim() as UnitRegionized) || 'unknown';

			const unitTotals = ingredientMap[key].mergedQuantity[unitKey] ?? {
				withOptionals: 0,
				requiredOnly: 0,
				optionalOnly: 0
			};

			unitTotals.withOptionals += shoppingItem.quantity;

			if (isOptional) unitTotals.optionalOnly += shoppingItem.quantity;
			else unitTotals.requiredOnly += shoppingItem.quantity;

			ingredientMap[key].mergedQuantity[unitKey] = unitTotals;
		}
	});

	// Merge meal ingredients, keeping track of which meals they come from.
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
					mergedQuantity: {}
				};
			}

			// Push this meal as an origin and the shopping item
			ingredientMap[key].meals.push(meal);
		});
	});

	// Compact quantities for each ingredient using mergeQuantities (separately for required and optional)
	Object.values(ingredientMap).forEach((ingredient) => {
		// Keep only units that can actually be merged
		const entries = Object.entries(ingredient.mergedQuantity).filter(
			([unit, q]) =>
				unit !== 'unknown' && q && (q.withOptionals > 0 || q.requiredOnly > 0 || q.optionalOnly > 0)
		);

		// Early skip if nothing to merge
		if (entries.length === 0) {
			ingredient.mergedQuantity = {};
			return;
		}

		const merged: typeof ingredient.mergedQuantity = {};
		const quantityTypes = ['withOptionals', 'requiredOnly', 'optionalOnly'] as const;

		for (const quantityType of quantityTypes) {
			const quantitiesToMerge = entries.reduce(
				(acc, [unit, quantities]) => {
					const qty = quantities[quantityType];
					if (qty > 0) acc[unit as UnitRegionized] = qty;
					return acc;
				},
				{} as Partial<Record<UnitRegionized, number>>
			);

			// Early skip this bucket if empty or has 1
			if (Object.keys(quantitiesToMerge).length === 0) continue;

			const mergedQuantities = mergeQuantities(quantitiesToMerge);

			for (const [unit, qty] of Object.entries(mergedQuantities)) {
				const unitKey = unit as UnitRegionized;
				const target = (merged[unitKey] ??= {
					withOptionals: 0,
					requiredOnly: 0,
					optionalOnly: 0
				});
				target[quantityType] = qty;
			}
		}

		ingredient.mergedQuantity = merged;
	});

	return Object.values(ingredientMap).sort((a, b) => {
		const aChecked = a.items.some((si) => si.checked_at);
		const bChecked = b.items.some((si) => si.checked_at);

		// Keep unchecked items first
		if (aChecked !== bChecked) {
			return Number(aChecked) - Number(bChecked);
		}

		// Within checked items, sort by descending checked_at
		if (aChecked && bChecked) {
			const toTimestamp = (value: Date | string | null | undefined): number => {
				if (!value) return 0;
				if (value instanceof Date) return value.getTime();
				const time = new Date(value).getTime();
				return Number.isNaN(time) ? 0 : time;
			};

			const aCheckedAt = Math.max(...a.items.map((si) => toTimestamp(si.checked_at)));
			const bCheckedAt = Math.max(...b.items.map((si) => toTimestamp(si.checked_at)));
			return bCheckedAt - aCheckedAt;
		}

		// Alphabetical order within unchecked items
		const aSlug = a.ingredient?.slug || a.name;
		const bSlug = b.ingredient?.slug || b.name;
		return aSlug.localeCompare(bSlug);
	});
}

/**
 * Formats the combined quantity of a shopping list item for display, showing required and optional quantities.
 * For example: "2 to 5 cups + 1 tbsp" (if there are 2 required cups and 3 optional cups, and 1 required tbsp).
 */
export function formatCombinedItemQuantity(item: CombinedShoppingListItem): string {
	const parts: string[] = [];

	for (const [unit, qty] of Object.entries(item.mergedQuantity)) {
		const unitStr = unit === 'whole' ? '' : ` ${unit}`;
		if (qty.optionalOnly > 0) {
			if (qty.requiredOnly > 0) {
				parts.push(
					`${formatQuantityAmount(qty.requiredOnly)} to ${formatQuantityAmount(qty.withOptionals)}${unitStr}`
				);
			} else {
				parts.push(`${formatQuantityAmount(qty.optionalOnly)}${unitStr}`);
			}
		} else {
			parts.push(`${formatQuantityAmount(qty.withOptionals)}${unitStr}`);
		}
	}

	const nOptionals = Object.values(item.mergedQuantity).reduce(
		(acc, q) => acc + (q.optionalOnly > 0 ? 1 : 0),
		0
	);

	let optText = '';
	if (
		nOptionals === 1 ||
		(nOptionals > 0 && nOptionals === Object.keys(item.mergedQuantity).length)
	) {
		optText = ' (opt)';
	} else if (nOptionals > 1) {
		optText = ' (has opt)';
	}
	return parts.join(' + ') + optText;
}

export function formatQuantityAmount(amount: number) {
	const commonFractions = [
		[0.0625, '⅟₁₆'],
		[0.125, '⅛'],
		[0.1875, '⅜'],
		[0.25, '¼'],
		[0.3125, '⅝'],
		[0.375, '⅜'],
		[0.4375, '⅞'],
		[0.5, '½'],
		[0.5625, '⅞'],
		[0.625, '⅝'],
		[0.6875, '⅞'],
		[0.75, '¾'],
		[0.8125, '⅞'],
		[0.875, '⅞'],
		[0.9375, '⅞'],
		[0.2, '⅕'],
		[0.4, '⅖'],
		[0.6, '⅗'],
		[0.8, '⅘'],
		[1 / 3, '⅓'],
		[0.33, '⅓'],
		[0.34, '⅓'],
		[2 / 3, '⅔'],
		[0.66, '⅔'],
		[0.67, '⅔']
	] as const;

	if (Number.isInteger(amount)) {
		return String(amount);
	}

	const wholePart = Math.trunc(amount);
	const decimalPart = Math.abs(amount - wholePart);
	const matchingFraction = commonFractions.find(([value]) => Math.abs(decimalPart - value) < 1e-6);

	if (matchingFraction) {
		const [, fractionText] = matchingFraction;
		const sign = amount < 0 ? '-' : '';
		const scaledWhole = Math.abs(wholePart);
		return `${sign}${scaledWhole > 0 ? `${scaledWhole} ${fractionText}` : fractionText}`;
	}

	return amount
		.toFixed(1)
		.replace(/\.00$/, '')
		.replace(/(\.\d)0$/, '$1');
}
