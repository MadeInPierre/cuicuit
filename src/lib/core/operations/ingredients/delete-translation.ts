import { z } from 'zod';

import { languageCodeSchema } from '$lib/shared/language.js';

import { OpError } from '../errors.js';
import { resolveLanguageId } from '../languages/resolve.js';
import { defineOp, type OpCtx } from '../registry.js';
import { requireAdmin } from './require-admin.js';

export const deleteIngredientTranslationInput = z.object({
	ingredientId: z.string().uuid(),
	lang: languageCodeSchema
});

export type DeleteIngredientTranslationInput = z.infer<typeof deleteIngredientTranslationInput>;

/**
 * `ingredients.delete-translation` — admin-only: removes one translation row.
 * Missing row → `NOT_FOUND`.
 */
export const deleteIngredientTranslationOp = defineOp({
	name: 'ingredients.delete-translation',
	domain: 'ingredients',
	kind: 'write',
	sync: 'server-only',
	docs: {
		title: 'Delete an ingredient translation (admin)',
		description: 'Admin-only: removes an ingredient translation for one language.',
	},
	input: deleteIngredientTranslationInput,
	internal: true,
	handler: async (ctx: OpCtx, input: DeleteIngredientTranslationInput) => {
		const admin = await requireAdmin(ctx);

		const { id: languageId } = await resolveLanguageId(admin, input.lang);

		const { data, error } = await admin
			.from('ingredient_translations')
			.delete()
			.eq('ingredient_id', input.ingredientId)
			.eq('language_id', languageId)
			.select('ingredient_id');
		if (error) {
			throw new OpError('INTERNAL', 'Failed to delete ingredient translation.', error);
		}
		if (!data || data.length === 0) {
			throw new OpError('NOT_FOUND', 'Ingredient translation not found.');
		}
		return true;
	}
});
