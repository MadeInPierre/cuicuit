import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';

export const listIngredientsInput = z.object({
	start: z.number().int().min(0).default(0),
	end: z.number().int().min(0).default(1000)
});

export type ListIngredientsInput = z.infer<typeof listIngredientsInput>;

/**
 * M1 example op proving the `defineOp` pattern end-to-end.
 * Mirrors the admin ingredients browser query
 * (`src/routes/(app)/admin/ingredients/+page.svelte:fetchIngredients`) 1:1 —
 * same select with translations+language join, same `.range(start, end)`.
 * M2 migrates the page to call this op (the page keeps its catch-and-return-[]
 * behavior; the op itself throws `OpError` on failure per the core contract).
 */
async function listIngredientsHandler(ctx: OpCtx, { start, end }: ListIngredientsInput) {
	const { data, error } = await ctx.supabase
		.from('ingredients')
		.select('*, translations:ingredient_translations(*, language:languages!inner(*))')
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
	input: listIngredientsInput,
	handler: listIngredientsHandler
});
