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

	const { data: ingredient, error: ingredientError } = await admin
		.from('ingredients')
		.select('*')
		.eq('id', input.ingredientId)
		.single();
	if (ingredientError || !ingredient) {
		throw new OpError('NOT_FOUND', 'Ingredient not found.', ingredientError);
	}

	const { data: translations, error: translationsError } = await admin
		.from('ingredient_translations')
		.select('*, language:languages!inner(*)')
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
