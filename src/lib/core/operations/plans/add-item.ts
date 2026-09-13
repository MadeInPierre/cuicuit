import { z } from 'zod';

import type { Tables } from '$lib/shared/db/supabase.types';

import { OpError } from '../errors.js';
import { defineOp } from '../registry.js';

export const addItemInput = z.object({
	spaceId: z.string().min(1),
	createdBy: z.string().min(1),
	// Optional ingredient id (CLI callers omit it for free-text items; `undefined` serializes to the column default `null`, same as explicit `null`).
	ingredientId: z.string().nullable().optional(),
	name: z.string(),
	quantity: z.number().nullable().optional(),
	unit: z.string().nullable().optional()
});

export type AddItemInput = z.infer<typeof addItemInput>;

/**
 * Normalizes a free-text item name the same way `buildCustomIngredientName`
 * (features/ingredients) does. Kept as a dependency-free copy so core never
 * imports UI-layer modules.
 */
function normalizeItemName(rawText: string | null | undefined): string {
	const trimmed = rawText?.trim() ?? '';
	if (trimmed.length === 0) return trimmed;
	return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

/**
 * Adds a standalone (`independent`) item to the shopping list.
 * Moved from `features/plans/actions/add-shopping-item.ts`
 * (refresh stripped — callers refresh).
 */
export const addItemOp = defineOp({
	name: 'plans.add-item',
	domain: 'plans',
	kind: 'write',
	sync: 'synced',
	input: addItemInput,
	handler: async (ctx, { spaceId, createdBy, ingredientId, name, quantity, unit }) => {
		const { data, error } = await ctx.supabase
			.from('space_items')
			.insert({
				space_id: spaceId,
				created_by: createdBy,
				type: 'independent',
				ingredient_id: ingredientId,
				quantity: quantity ?? null,
				unit: unit ?? null,
				name: normalizeItemName(name),
				priority: 'required'
			})
			.select()
			.single();

		if (error || !data) {
			throw new OpError('INTERNAL', 'Failed to add shopping item.', error);
		}
		return data;
	}
});

export type AddItemOutput = Tables<'space_items'>;
