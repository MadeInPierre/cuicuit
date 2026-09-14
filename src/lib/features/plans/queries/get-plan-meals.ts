import { getClientCtx, runOp } from '$lib/core/operations/client.js';
import {
	listMealsOp,
	type ListMealsInput,
	type ListMealsOutput,
	type PlanMealRow,
	type ShoppingIngredient as ShoppingIngredientRow
} from '$lib/core/operations/plans/list-meals.js';
import { resolveIngredientName } from '$lib/features/ingredients/utils/ingredient-display';
import { isPluralAmount } from '$lib/shared/utils/format-quantity';

// Thin adapter over the `plans.list-meals` op. Keeps the legacy chainable
// `.is('deleted_at', null)` shape used by `active-space.svelte.ts` (the op already
// excludes soft-deleted meals, so the filter args are accepted and ignored).

import type { LanguageCode } from '$lib/shared/language.js';

export function getPlanMeals(spaceId: string, lang: LanguageCode) {
	return {
		is: async (_column: string, _value: null) => {
			// Accepted and ignored: the op already excludes soft-deleted rows.
			void _column;
			void _value;
			const data = await runOp<ListMealsInput, ListMealsOutput>(
				listMealsOp.name,
				await getClientCtx(),
				{ spaceId, lang }
			);
			return { data, error: null };
		}
	};
}

export type MealWithRecipeAndIngredients = PlanMealRow;
export type ShoppingIngredient = ShoppingIngredientRow;

export function formatIngredientDisplayName(si: ShoppingIngredient) {
	return resolveIngredientName(si.ingredient?.translations, {
		plural: isPluralAmount(si.quantity),
		customName: si.name
	});
}
