import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';

export const listIngredientsInput = z.object({
	start: z.number().int().min(0).default(0),
	end: z.number().int().min(0).default(1000)
});

export type ListIngredientsInput = z.infer<typeof listIngredientsInput>;

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
