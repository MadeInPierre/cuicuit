import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';

export const listIngredientsInput = z.object({
	start: z.number().int().min(0).default(0),
	end: z.number().int().min(0).default(1000)
});

export type ListIngredientsInput = z.infer<typeof listIngredientsInput>;

async function listIngredientsHandler(ctx: OpCtx, { start, end }: ListIngredientsInput) {
	// Narrow projection: everything except `ingredients.embedding` (≈4KB/row) and
	// `ingredient_translations.fts`, neither of which the admin UI reads. The
	// language join keeps `name_en` (shown next to each translation's lang).
	const { data, error } = await ctx.supabase
		.from('ingredients')
		.select(
			'id, slug, slug_general, aisle, hierarchy, base_unit, unit_frequencies, g_per_unit, g_per_ml, translations:ingredient_translations(ingredient_id, language_id, name_singular, name_plural, name_general, commonly_used, language:languages!inner(lang, name_en))'
		)
		.range(start, end);
	if (error) {
		throw new OpError('INTERNAL', 'Failed to list ingredients.', error);
	}
	return data;
}

export type ListIngredientsResult = Awaited<ReturnType<typeof listIngredientsHandler>>;

export const listIngredientsOp = defineOp({
	name: 'ingredients.list',
	domain: 'ingredients',
	kind: 'read',
	sync: 'synced',
	docs: {
		title: 'List ingredients',
		description: 'Lists ingredients with translations in a paginated range.'
	},
	input: listIngredientsInput,
	handler: listIngredientsHandler
});
