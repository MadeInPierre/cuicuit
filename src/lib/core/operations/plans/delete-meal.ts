import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp } from '../registry.js';

export const deleteMealInput = z.object({
	mealId: z.string().min(1),
	undo: z.boolean().default(false),
	// Only a right swipe marks the meal as cooked; both swipes soft-delete it.
	cooked: z.boolean().default(false)
});

export type DeleteMealInput = z.infer<typeof deleteMealInput>;

export type DeleteMealOutput = {
	mealId: string;
	/** ISO timestamp written to `deleted_at`, or null when restored via `undo`. */
	deletedAt: string | null;
	cooked: boolean;
};

/**
 * Soft-deletes a meal and its linked shopping items (or restores them via `undo`).
 * Moved from `features/plans/actions/update-meal.ts:deleteMeal`
 * (optimistic local state, toast and refresh stripped — the adapter keeps those).
 */
export const deleteMealOp = defineOp({
	name: 'plans.delete-meal',
	domain: 'plans',
	kind: 'write',
	sync: 'synced',
	input: deleteMealInput,
	handler: async (ctx, { mealId, undo, cooked: cookedInput }) => {
		// TODO update meal positions as they may not go from 1 to N anymore

		// Soft delete related shopping list items first
		const now = new Date().toISOString();
		const { error: shoppingListError } = await ctx.supabase
			.from('space_items')
			.update({ deleted_at: undo ? null : now })
			.eq('meal_id', mealId)
			.eq('type', 'meal');

		if (shoppingListError) {
			throw new OpError(
				'INTERNAL',
				'Failed to soft-delete shopping list items.',
				shoppingListError
			);
		}

		// Both swipes soft-delete the meal (deleted_at), but only a right swipe
		// marks it as cooked so past cooked meals can feed a timeline later.
		const cooked = undo ? false : (cookedInput ?? false);
		const { error } = await ctx.supabase
			.from('space_meals')
			.update({ deleted_at: undo ? null : now, cooked })
			.eq('id', mealId);
		if (error) {
			throw new OpError('INTERNAL', 'Failed to soft-delete meal.', error);
		}

		const output: DeleteMealOutput = { mealId, deletedAt: undo ? null : now, cooked };
		return output;
	}
});
