import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp } from '../registry.js';

export const deleteItemInput = z.object({
	itemId: z.string().min(1),
	spaceId: z.string().min(1).optional(),
	deleted: z.boolean().default(true),
	// `undo` restores the item; `expectedDeletedAt` carries the timestamp written by
	// the paired delete so the restore only applies when the row still holds it
	// (same optimistic-concurrency guard the UI undo used to apply client-side).
	undo: z.boolean().default(false),
	expectedDeletedAt: z.string().nullable().optional()
});

export type DeleteItemInput = z.infer<typeof deleteItemInput>;

export type DeleteItemOutput = {
	itemId: string;
	/** ISO timestamp written to `deleted_at`, or null when restored/cleared. */
	deletedAt: string | null;
};

/**
 * Soft-deletes a shopping item (or restores it via `undo`).
 * Moved from `features/plans/actions/update-item.ts:updatePlanItemDeleted`
 * (toast and refresh stripped — the adapter keeps those).
 */
export const deleteItemOp = defineOp({
	name: 'plans.delete-item',
	domain: 'plans',
	kind: 'write',
	sync: 'synced',
	docs: {
		title: 'Delete shopping item',
		description: 'Soft-deletes a shopping item or restores it via `undo`.',
		hints: [
			'Deletes are soft (`deleted_at`): the item vanishes from shopping_list but is restorable with `undo: true`.'
		]
	},
	input: deleteItemInput,
	handler: async (ctx, { itemId, spaceId, deleted, undo, expectedDeletedAt }) => {
		if (undo) {
			const deletedAt = deleted ? null : (expectedDeletedAt ?? new Date().toISOString());
			let query = ctx.supabase
				.from('space_items')
				.update({ deleted_at: deletedAt })
				.eq('id', itemId);
			// Only undo when the row still holds the timestamp the paired delete wrote.
			if (expectedDeletedAt !== undefined) {
				query =
					expectedDeletedAt === null
						? query.is('deleted_at', null)
						: query.eq('deleted_at', expectedDeletedAt);
			}
			const { error: undoError } = await query;
			if (undoError) {
				throw new OpError('INTERNAL', 'Failed to restore plan item.', undoError);
			}
			const output: DeleteItemOutput = { itemId, deletedAt };
			return output;
		}

		const now = new Date().toISOString();
		const deletedAt = deleted ? now : null;
		let query = ctx.supabase.from('space_items').update({ deleted_at: deletedAt }).eq('id', itemId);
		if (spaceId) {
			query = query.eq('space_id', spaceId);
		}
		const { error } = await query;
		if (error) {
			throw new OpError('INTERNAL', 'Failed to delete plan item.', error);
		}

		const output: DeleteItemOutput = { itemId, deletedAt };
		return output;
	}
});
