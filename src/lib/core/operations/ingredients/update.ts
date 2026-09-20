import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';
import { ingredientPatchFields } from './admin-schemas.js';
import { requireAdmin } from './require-admin.js';

export const updateIngredientInput = z.object({
	ingredientId: z.string().uuid(),
	patch: ingredientPatchFields
});

export type UpdateIngredientInput = z.infer<typeof updateIngredientInput>;

/**
 * `ingredients.update` — admin-only: patches base-table fields
 * (`slug`, `aisle`, `hierarchy`, `base_unit`, unit maps, `g_per_ml`).
 * Empty patch → `VALIDATION`; unknown id → `NOT_FOUND`; slug clash → `CONFLICT`.
 */
export const updateIngredientOp = defineOp({
	name: 'ingredients.update',
	domain: 'ingredients',
	kind: 'write',
	sync: 'server-only',
	docs: {
		title: 'Update an ingredient (admin)',
		description: 'Admin-only: patches an ingredient base-table fields (slug, aisle, units, …).',
	},
	input: updateIngredientInput,
	internal: true,
	handler: async (ctx: OpCtx, input: UpdateIngredientInput) => {
		const admin = await requireAdmin(ctx);
		const { ingredientId, patch } = input;

		const update = {
			...(patch.slug !== undefined ? { slug: patch.slug } : {}),
			...(patch.slugGeneral !== undefined ? { slug_general: patch.slugGeneral } : {}),
			...(patch.aisle !== undefined ? { aisle: patch.aisle } : {}),
			...(patch.hierarchy !== undefined ? { hierarchy: patch.hierarchy } : {}),
			...(patch.baseUnit !== undefined ? { base_unit: patch.baseUnit } : {}),
			...(patch.unitFrequencies !== undefined
				? { unit_frequencies: patch.unitFrequencies ?? null }
				: {}),
			...(patch.gPerUnit !== undefined ? { g_per_unit: patch.gPerUnit ?? null } : {}),
			...(patch.gPerMl !== undefined ? { g_per_ml: patch.gPerMl ?? null } : {})
		};
		if (Object.keys(update).length === 0) {
			throw new OpError('VALIDATION', 'Nothing to update: patch is empty.');
		}

		const { data, error } = await admin
			.from('ingredients')
			.update(update)
			.eq('id', ingredientId)
			.select('id');
		if (error) {
			if (error.code === '23505') {
				throw new OpError('CONFLICT', 'ingredient-slug-exists', error);
			}
			throw new OpError('INTERNAL', 'Failed to update ingredient.', error);
		}
		if (!data || data.length === 0) {
			throw new OpError('NOT_FOUND', 'Ingredient not found.');
		}
		return { id: data[0].id };
	}
});
