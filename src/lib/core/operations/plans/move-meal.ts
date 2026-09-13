import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp } from '../registry.js';

export const moveMealInput = z.object({
	mealId: z.string().min(1),
	position: z.number().int().min(0)
});

export type MoveMealInput = z.infer<typeof moveMealInput>;

export type MoveMealOutput = {
	mealId: string;
	position: number;
};

/**
 * Moves a meal to a new position in the plan.
 * Moved from `features/plans/actions/update-meal.ts:updateMealPosition`
 * (refresh stripped — callers refresh).
 */
export const moveMealOp = defineOp({
	name: 'plans.move-meal',
	domain: 'plans',
	kind: 'write',
	sync: 'synced',
	docs: { title: 'Move meal', description: 'Moves a meal to a new position in the plan.' },
	input: moveMealInput,
	handler: async (ctx, { mealId, position }) => {
		const { error } = await ctx.supabase.from('space_meals').update({ position }).eq('id', mealId);
		if (error) {
			throw new OpError('INTERNAL', 'Failed to update meal position.', error);
		}

		const output: MoveMealOutput = { mealId, position };
		return output;
	}
});
