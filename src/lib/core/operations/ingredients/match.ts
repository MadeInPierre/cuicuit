import { z } from 'zod';

import { languageKeySchema } from '$lib/features/user-settings/consts.js';
import type { Database } from '$lib/shared/db/supabase.types';

import { defineOp } from '../registry.js';
import { preprocessIngredient } from './match-helpers.js';

export const matchIngredientsInput = z.object({
	ingredientStrings: z.array(z.string()).min(1),
	lang: languageKeySchema
});

export type MatchIngredientsInput = z.infer<typeof matchIngredientsInput>;

type MatchRow = Database['public']['Functions']['match_ingredient']['Returns'][number];

export interface IngredientMatch {
	originalText: string;
	cleaned?: string;
	bestMatches: MatchRow[];
	message: string;
}

export interface MatchIngredientsResult {
	matches: IngredientMatch[];
}

/**
 * `ingredients.match` — fuzzy-match raw ingredient strings against the
 * ingredients table via the `match_ingredient` RPC (10 candidates each).
 *
 * Body moved verbatim from
 * `src/lib/features/ingredients/server/match-ingredients.remote.ts`
 * (`getRequestEvent().locals.supabase` becomes `ctx.supabase`; preprocessing
 * lives in `./match-helpers.ts`). Return shape `{ matches }` is preserved 1:1,
 * including per-item error swallowing (empty-after-cleaning and RPC failures
 * yield `{ bestMatches: [], message }` items, never throws).
 */
export const matchIngredientsOp = defineOp({
	name: 'ingredients.match',
	domain: 'ingredients',
	kind: 'rpc',
	sync: 'server-only',
	docs: {
		title: 'Match ingredients',
		description: 'Fuzzy-matches raw ingredient strings against the ingredients catalog via RPC.'
	},
	input: matchIngredientsInput,
	handler: async (ctx, { ingredientStrings, lang }): Promise<MatchIngredientsResult> => {
		const matchPromises = ingredientStrings.map(async (originalText: string) => {
			const cleanedText = preprocessIngredient(originalText);

			if (!cleanedText) {
				return { originalText, bestMatches: [], message: 'Empty after cleaning.' };
			}

			const { data, error } = await ctx.supabase.rpc('match_ingredient', {
				query_text: cleanedText,
				lang_code: lang || 'fr-FR',
				n_matches: 10
			});

			if (error) {
				return { originalText, bestMatches: [], message: 'An error occured during RPC matching.' };
			}

			return {
				originalText,
				cleaned: cleanedText,
				bestMatches: data || [],
				message: ''
			};
		});

		const matches = await Promise.all(matchPromises);
		return { matches };
	}
});
