import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import type { Database } from '$lib/shared/db/supabase.types';

import { OpError } from '../errors.js';
import { defineOp } from '../registry.js';
import { recipesDetailedQuery, type RecipeDetailedRow } from './list.js';

export const getRecipeInput = z.object({
	recipeId: z.string().min(1),
	languageId: z.number().int()
});

export type GetRecipeInput = z.infer<typeof getRecipeInput>;

/** Shared with the thin `get-recipe-detailed.ts` adapter so its author type stays identical. */
export function recipeAuthorQuery(client: SupabaseClient<Database>, authorId: string) {
	return client.from('user_public_profiles').select('*').eq('user_id', authorId).single();
}

export type RecipeAuthorRow = NonNullable<Awaited<ReturnType<typeof recipeAuthorQuery>>['data']>;

export type GetRecipeOutput = RecipeDetailedRow & { author: RecipeAuthorRow };

/**
 * Fetches a single detailed recipe plus its author's public profile.
 * Moved from `features/recipes/queries/get-recipe-detailed.ts:getRecipeDetailed`.
 */
export const getRecipeOp = defineOp({
	name: 'recipes.get',
	domain: 'recipes',
	kind: 'read',
	sync: 'synced',
	docs: {
		title: 'Get recipe',
		description: 'Fetches a single detailed recipe plus its author public profile.'
	},
	input: getRecipeInput,
	handler: async (ctx, { recipeId, languageId }) => {
		// Get the recipe
		const { data, error } = await recipesDetailedQuery(ctx.supabase, languageId)
			.eq('id', recipeId)
			.single();
		if (error || !data) {
			throw new OpError('NOT_FOUND', 'Recipe not found.', error);
		}

		// Add the author's public profile
		const { data: authorProfile, error: profileError } = await recipeAuthorQuery(
			ctx.supabase,
			data.author_id!
		);
		if (profileError || !authorProfile) {
			throw new OpError('NOT_FOUND', 'Recipe author not found.', profileError);
		}

		return { ...data, author: authorProfile };
	}
});
