import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';
import { requireAdmin } from './require-admin.js';

export const getIngredientInput = z.object({
	ingredientId: z.string().uuid()
});

export type GetIngredientInput = z.infer<typeof getIngredientInput>;

async function getIngredientHandler(ctx: OpCtx, input: GetIngredientInput) {
	const admin = await requireAdmin(ctx);

	// Narrow projection: everything except `ingredients.embedding` (≈4KB/row),
	// which the admin UI never reads.
	const { data: ingredient, error: ingredientError } = await admin
		.from('ingredients')
		.select(
			'id, slug, slug_general, aisle, hierarchy, base_unit, unit_frequencies, g_per_unit, g_per_ml'
		)
		.eq('id', input.ingredientId)
		.single();
	if (ingredientError || !ingredient) {
		throw new OpError('NOT_FOUND', 'Ingredient not found.', ingredientError);
	}

	// Narrow projection: everything except `ingredient_translations.fts`, which
	// nothing reads. The language join keeps `name_en` (shown next to each lang).
	const { data: translations, error: translationsError } = await admin
		.from('ingredient_translations')
		.select(
			'ingredient_id, language_id, name_singular, name_plural, name_general, commonly_used, language:languages!inner(lang, name_en)'
		)
		.eq('ingredient_id', input.ingredientId);
	if (translationsError) {
		throw new OpError('INTERNAL', 'Failed to load ingredient translations.', translationsError);
	}

	const { data: substitutionsAsOriginal, error: asOriginalError } = await admin
		.from('ingredient_substitutions')
		.select('*')
		.eq('original_ingredient_id', input.ingredientId);
	if (asOriginalError) {
		throw new OpError('INTERNAL', 'Failed to load ingredient substitutions.', asOriginalError);
	}

	const { data: substitutionsAsSubstitute, error: asSubstituteError } = await admin
		.from('ingredient_substitutions')
		.select('*')
		.eq('substitute_ingredient_id', input.ingredientId);
	if (asSubstituteError) {
		throw new OpError('INTERNAL', 'Failed to load ingredient substitutions.', asSubstituteError);
	}

	return { ingredient, translations, substitutionsAsOriginal, substitutionsAsSubstitute };
}

export type GetIngredientResult = Awaited<ReturnType<typeof getIngredientHandler>>;

/**
 * `ingredients.get` — admin-only detail read: one ingredient row plus all its
 * translations (with languages) and substitutions in both directions.
 */
export const getIngredientOp = defineOp({
	name: 'ingredients.get',
	domain: 'ingredients',
	kind: 'read',
	sync: 'server-only',
	docs: {
		title: 'Get one ingredient (admin)',
		description:
			'Admin-only: loads a single ingredient with all translations and substitutions in both directions.',
	},
	input: getIngredientInput,
	internal: true,
	handler: getIngredientHandler
});
