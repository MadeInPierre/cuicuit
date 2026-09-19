import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp } from '../registry.js';

export const checkItemInput = z.object({
	itemId: z.string().min(1),
	checked: z.boolean(),
	// `undo` flips the target state back (restores the pre-call `checked_at`).
	undo: z.boolean().default(false)
});

export type CheckItemInput = z.infer<typeof checkItemInput>;

export type CheckItemOutput = {
	itemId: string;
	checked: boolean;
	/** ISO timestamp written to `checked_at`, or null when unchecked. */
	checkedAt: string | null;
};

/**
 * Checks/unchecks a shopping item (or reverts via `undo`).
 * Moved from `features/plans/actions/update-item.ts:updatePlanItemChecked`
 * (toast and refresh stripped — the adapter keeps those).
 */
export const checkItemOp = defineOp({
	name: 'plans.check-item',
	domain: 'plans',
	kind: 'write',
	sync: 'synced',
	docs: {
		title: 'Check/uncheck a shopping item',
		description:
			'Sets the checked state of a shopping item by `itemId`. Pass `checked: true/false`; `undo: true` reverts to the previous state (restores the prior `checked_at`).',
		tool: 'shopping_check',
		hints: [
			'Checking is not deleting: checked items stay in shopping_list with `checked_at` set. Use the delete tool to remove an item.'
		]
	},
	input: checkItemInput,
	handler: async (ctx, { itemId, checked, undo }) => {
		const effective = undo ? !checked : checked;
		const checkedAt = effective ? new Date().toISOString() : null;
		const { data, error } = await ctx.supabase
			.from('space_items')
			.update({ checked_at: checkedAt })
			.eq('id', itemId)
			.select('id');
		if (error) {
			throw new OpError('INTERNAL', 'Failed to update plan item.', error);
		}
		if (!data || data.length === 0) {
			throw new OpError('NOT_FOUND', 'Shopping item not found or not accessible.');
		}

		const output: CheckItemOutput = { itemId, checked: effective, checkedAt };
		return output;
	}
});
