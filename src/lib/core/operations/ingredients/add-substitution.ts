import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';
import { substitutionStrengthSchema } from './admin-schemas.js';
import { requireAdmin } from './require-admin.js';

export const addIngredientSubstitutionInput = z.object({
	originalIngredientId: z.string().uuid(),
	substituteIngredientId: z.string().uuid(),
	strength: substitutionStrengthSchema,
	ratio: z.number().positive().default(1)
});

export type AddIngredientSubstitutionInput = z.infer<typeof addIngredientSubstitutionInput>;

/**
 * `ingredients.add-substitution` — admin-only: links a substitute to an
 * ingredient. Self-substitution → `VALIDATION` (mirrors the DB CHECK);
 * duplicate `(original, substitute, strength)` → `CONFLICT`; unknown
 * ingredient id → `NOT_FOUND`.
 */
export const addIngredientSubstitutionOp = defineOp({
	name: 'ingredients.add-substitution',
	domain: 'ingredients',
	kind: 'write',
	sync: 'server-only',
	docs: {
		title: 'Add an ingredient substitution (admin)',
		description: 'Admin-only: links a substitute ingredient with a strength and ratio.',
	},
	input: addIngredientSubstitutionInput,
	internal: true,
	handler: async (ctx: OpCtx, input: AddIngredientSubstitutionInput) => {
		const admin = await requireAdmin(ctx);
		const { originalIngredientId, substituteIngredientId, strength, ratio } = input;

		if (originalIngredientId === substituteIngredientId) {
			throw new OpError('VALIDATION', 'An ingredient cannot substitute itself.');
		}

		const { data, error } = await admin
			.from('ingredient_substitutions')
			.insert({
				original_ingredient_id: originalIngredientId,
				substitute_ingredient_id: substituteIngredientId,
				strength,
				original_to_substitute_ratio: ratio
			})
			.select('id')
			.single();
		if (error || !data) {
			if (error?.code === '23505') {
				throw new OpError('CONFLICT', 'ingredient-substitution-exists', error);
			}
			if (error?.code === '23503') {
				throw new OpError('NOT_FOUND', 'Ingredient not found.', error);
			}
			throw new OpError('INTERNAL', 'Failed to add ingredient substitution.', error);
		}
		return { id: data.id };
	}
});
