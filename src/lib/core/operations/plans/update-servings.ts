import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp } from '../registry.js';

export const updateServingsInput = z.object({
	spaceId: z.string().min(1),
	mealId: z.string().min(1),
	servings: z.number().min(1),
	// Snapshot of the meal's recipe scaling basis, passed by the caller (local-first
	// friendly: no server re-fetch needed, same values the UI already holds).
	recipeServings: z.number(),
	ingredients: z.array(
		z.object({
			ingredientId: z.string().nullable(),
			customName: z.string().nullable(),
			quantity: z.number().nullable()
		})
	)
});

export type UpdateServingsInput = z.infer<typeof updateServingsInput>;

export type UpdateServingsOutput = {
	mealId: string;
	servings: number;
};

/**
 * Rescales a meal and every linked shopping item to a new servings count.
 * Moved from `features/plans/actions/update-meal.ts:updateMealServings`
 * (refresh stripped — callers refresh).
 */
export const updateServingsOp = defineOp({
	name: 'plans.update-servings',
	domain: 'plans',
	kind: 'write',
	sync: 'synced',
	docs: {
		title: 'Update servings',
		description:
			'Rescales a meal and its linked shopping items to a new servings count. You do NOT need to compute quantities — just pass the snapshot below and the server scales everything.',
		tool: 'plan_update',
		hints: [
			'Build `ingredients[]` from the meal as returned by plan_list: for each entry of `recipe.recipe_ingredients`, map `ingredient_id` → `ingredientId`, `custom_name` → `customName`, `quantity` → `quantity`; take `recipeServings` from `recipe.servings`.',
			'Example: {"spaceId":"<uuid>","mealId":"<uuid>","servings":6,"recipeServings":4,"ingredients":[{"ingredientId":"<uuid>","customName":null,"quantity":200},{"ingredientId":null,"customName":"Salt","quantity":null}]}'
		]
	},
	input: updateServingsInput,
	handler: async (ctx, { spaceId, mealId, servings, recipeServings, ingredients }) => {
		// Update the meal servings
		const { data, error } = await ctx.supabase
			.from('space_meals')
			.update({ servings })
			.eq('id', mealId)
			.select('id');
		if (error) {
			throw new OpError('INTERNAL', 'Failed to update meal servings.', error);
		}
		if (!data || data.length === 0) {
			throw new OpError('NOT_FOUND', 'Meal not found or not accessible.');
		}

		// Update every shopping list item related to this meal to reflect the new amounts
		for (const ing of ingredients) {
			// Skip rows that are neither catalog nor custom (rejected by DB constraints,
			// but guard anyway to avoid touching unrelated shopping items)
			if (!ing.ingredientId && !ing.customName) continue;

			const newAmount = ((ing.quantity ?? 1) * servings) / recipeServings;
			const itemLabel = ing.ingredientId ?? ing.customName ?? 'unknown';

			let query = ctx.supabase
				.from('space_items')
				.update({ quantity: newAmount })
				.eq('space_id', spaceId)
				.eq('meal_id', mealId);

			// Customs have no ingredient_id, match them by their free-text name instead
			query = ing.ingredientId
				? query.eq('ingredient_id', ing.ingredientId)
				: query.is('ingredient_id', null).eq('name', ing.customName ?? '');

			const { error: itemError } = await query;

			// Continue updating other items even if one fails
			if (itemError) {
				console.error(
					`Error updating shopping list item ${itemLabel} for meal ${mealId}: ${itemError.message}`
				);
			}
		}

		const output: UpdateServingsOutput = { mealId, servings };
		return output;
	}
});
