import { z } from 'zod';

import { languageCodeSchema } from '$lib/shared/language.js';

import { OpError } from '../errors.js';
import { resolveLanguageId } from '../languages/resolve.js';
import { defineOp, type OpCtx } from '../registry.js';
import { commonlyUsedSchema } from './admin-schemas.js';
import { requireAdmin } from './require-admin.js';

export const upsertIngredientTranslationInput = z.object({
	ingredientId: z.string().uuid(),
	lang: languageCodeSchema,
	nameSingular: z.string().min(1).nullish(),
	namePlural: z.string().min(1).nullish(),
	nameGeneral: z.string().min(1),
	commonlyUsed: commonlyUsedSchema.default('occasionally')
});

export type UpsertIngredientTranslationInput = z.infer<typeof upsertIngredientTranslationInput>;

/**
 * `ingredients.upsert-translation` — admin-only: inserts or replaces the
 * translation row for `(ingredient_id, lang)`. Unknown ingredient or language
 * → `NOT_FOUND`.
 */
export const upsertIngredientTranslationOp = defineOp({
	name: 'ingredients.upsert-translation',
	domain: 'ingredients',
	kind: 'write',
	sync: 'server-only',
	docs: {
		title: 'Upsert an ingredient translation (admin)',
		description: 'Admin-only: inserts or replaces an ingredient translation for one language.',
	},
	input: upsertIngredientTranslationInput,
	internal: true,
	handler: async (ctx: OpCtx, input: UpsertIngredientTranslationInput) => {
		const admin = await requireAdmin(ctx);

		const { data: ingredient, error: ingredientError } = await admin
			.from('ingredients')
			.select('id')
			.eq('id', input.ingredientId)
			.maybeSingle();
		if (ingredientError) {
			throw new OpError('INTERNAL', 'Failed to load ingredient.', ingredientError);
		}
		if (!ingredient) {
			throw new OpError('NOT_FOUND', 'Ingredient not found.');
		}

		const { id: languageId } = await resolveLanguageId(admin, input.lang);

		const { error } = await admin.from('ingredient_translations').upsert(
			{
				ingredient_id: input.ingredientId,
				language_id: languageId,
				name_singular: input.nameSingular ?? null,
				name_plural: input.namePlural ?? null,
				name_general: input.nameGeneral,
				commonly_used: input.commonlyUsed
			},
			{ onConflict: 'ingredient_id,language_id' }
		);
		if (error) {
			throw new OpError('INTERNAL', 'Failed to save ingredient translation.', error);
		}
		return { ingredientId: input.ingredientId, languageId };
	}
});
