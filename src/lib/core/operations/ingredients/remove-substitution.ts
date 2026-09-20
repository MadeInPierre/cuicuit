import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';
import { requireAdmin } from './require-admin.js';

export const removeIngredientSubstitutionInput = z.object({
	substitutionId: z.string().uuid()
});

export type RemoveIngredientSubstitutionInput = z.infer<typeof removeIngredientSubstitutionInput>;

/**
 * `ingredients.remove-substitution` — admin-only: deletes a substitution link.
 * Unknown id → `NOT_FOUND`.
 */
export const removeIngredientSubstitutionOp = defineOp({
	name: 'ingredients.remove-substitution',
	domain: 'ingredients',
	kind: 'write',
	sync: 'server-only',
	docs: {
		title: 'Remove an ingredient substitution (admin)',
		description: 'Admin-only: deletes an ingredient substitution link.',
	},
	input: removeIngredientSubstitutionInput,
	internal: true,
	handler: async (ctx: OpCtx, input: RemoveIngredientSubstitutionInput) => {
		const admin = await requireAdmin(ctx);

		const { data, error } = await admin
			.from('ingredient_substitutions')
			.delete()
			.eq('id', input.substitutionId)
			.select('id');
		if (error) {
			throw new OpError('INTERNAL', 'Failed to remove ingredient substitution.', error);
		}
		if (!data || data.length === 0) {
			throw new OpError('NOT_FOUND', 'Ingredient substitution not found.');
		}
		return true;
	}
});
