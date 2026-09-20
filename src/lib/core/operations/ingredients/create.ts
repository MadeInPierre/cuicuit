import { z } from 'zod';

import { languageCodeSchema } from '$lib/shared/language.js';

import { OpError } from '../errors.js';
import { resolveLanguageId } from '../languages/resolve.js';
import { defineOp, type OpCtx } from '../registry.js';
import {
	commonlyUsedSchema,
	ingredientBaseFields
} from './admin-schemas.js';
import { requireAdmin } from './require-admin.js';

export const createIngredientInput = ingredientBaseFields.extend({
	initialTranslation: z.object({
		lang: languageCodeSchema,
		nameSingular: z.string().min(1).nullish(),
		namePlural: z.string().min(1).nullish(),
		nameGeneral: z.string().min(1),
		commonlyUsed: commonlyUsedSchema.default('occasionally')
	})
});

export type CreateIngredientInput = z.infer<typeof createIngredientInput>;

/**
 * `ingredients.create` — admin-only: inserts an ingredient row plus its first
 * translation (a catalog row without any translation is useless to the UI).
 * Duplicate `slug` → `CONFLICT`.
 */
export const createIngredientOp = defineOp({
	name: 'ingredients.create',
	domain: 'ingredients',
	kind: 'write',
	sync: 'server-only',
	docs: {
		title: 'Create an ingredient (admin)',
		description:
			'Admin-only: creates an ingredient with its initial translation. Needed by the promote flow.',
	},
	input: createIngredientInput,
	internal: true,
	handler: async (ctx: OpCtx, input: CreateIngredientInput) => {
		const admin = await requireAdmin(ctx);
		const { initialTranslation, ...base } = input;

		const { id: languageId } = await resolveLanguageId(admin, initialTranslation.lang);

		const { data: created, error: createError } = await admin
			.from('ingredients')
			.insert({
				slug: base.slug,
				slug_general: base.slugGeneral,
				aisle: base.aisle,
				hierarchy: base.hierarchy,
				base_unit: base.baseUnit,
				unit_frequencies: base.unitFrequencies ?? null,
				g_per_unit: base.gPerUnit ?? null,
				g_per_ml: base.gPerMl ?? null
			})
			.select('id')
			.single();
		if (createError || !created) {
			if (createError?.code === '23505') {
				throw new OpError('CONFLICT', 'ingredient-slug-exists', createError);
			}
			throw new OpError('INTERNAL', 'Failed to create ingredient.', createError);
		}

		const { error: translationError } = await admin.from('ingredient_translations').insert({
			ingredient_id: created.id,
			language_id: languageId,
			name_singular: initialTranslation.nameSingular ?? null,
			name_plural: initialTranslation.namePlural ?? null,
			name_general: initialTranslation.nameGeneral,
			commonly_used: initialTranslation.commonlyUsed
		});
		if (translationError) {
			// Roll back the orphan row — a catalog row without translations is dead weight.
			await admin.from('ingredients').delete().eq('id', created.id);
			throw new OpError('INTERNAL', 'Failed to create ingredient translation.', translationError);
		}

		return { id: created.id };
	}
});
