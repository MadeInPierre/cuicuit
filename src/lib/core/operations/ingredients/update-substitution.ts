import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';
import { substitutionStrengthSchema } from './admin-schemas.js';
import { requireAdmin } from './require-admin.js';

export const updateIngredientSubstitutionInput = z.object({
	substitutionId: z.string().uuid(),
	strength: substitutionStrengthSchema.optional(),
	ratio: z.number().positive().optional()
});

export type UpdateIngredientSubstitutionInput = z.infer<typeof updateIngredientSubstitutionInput>;

/**
 * `ingredients.update-substitution` — admin-only: patches `strength` and/or
 * `ratio`. No fields → `VALIDATION`; unknown id → `NOT_FOUND`.
 */
export const updateIngredientSubstitutionOp = defineOp({
	name: 'ingredients.update-substitution',
	domain: 'ingredients',
	kind: 'write',
	sync: 'server-only',
	docs: {
		title: 'Update an ingredient substitution (admin)',
		description: 'Admin-only: patches a substitution strength and/or ratio.',
	},
	input: updateIngredientSubstitutionInput,
	internal: true,
	handler: async (ctx: OpCtx, input: UpdateIngredientSubstitutionInput) => {
		const admin = await requireAdmin(ctx);
		const { substitutionId, strength, ratio } = input;

		const update = {
			...(strength !== undefined ? { strength } : {}),
			...(ratio !== undefined ? { original_to_substitute_ratio: ratio } : {})
		};
		if (Object.keys(update).length === 0) {
			throw new OpError('VALIDATION', 'Nothing to update: provide strength and/or ratio.');
		}

		const { data, error } = await admin
			.from('ingredient_substitutions')
			.update(update)
			.eq('id', substitutionId)
			.select('id');
		if (error) {
			throw new OpError('INTERNAL', 'Failed to update ingredient substitution.', error);
		}
		if (!data || data.length === 0) {
			throw new OpError('NOT_FOUND', 'Ingredient substitution not found.');
		}
		return { id: data[0].id };
	}
});
