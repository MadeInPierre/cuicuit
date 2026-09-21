import { z } from 'zod';

import type { Database } from '$lib/shared/db/supabase.types';
import { DEFAULT_LANGUAGE, languageCodeSchema } from '$lib/shared/language.js';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';
import { preprocessIngredient } from './match-helpers.js';

export const matchIngredientsInput = z.object({
	ingredientStrings: z.array(z.string()).min(1),
	lang: languageCodeSchema
});

export type MatchIngredientsInput = z.infer<typeof matchIngredientsInput>;

type MatchRow = Database['public']['Functions']['match_ingredient']['Returns'][number];

async function matchIngredientsHandler(
	ctx: OpCtx,
	{ ingredientStrings, lang }: MatchIngredientsInput
) {
	const effectiveLang = lang || DEFAULT_LANGUAGE;
	const matchPromises = ingredientStrings.map(async (originalText: string) => {
		const cleanedText = preprocessIngredient(originalText, effectiveLang);

		if (!cleanedText) {
			return { originalText, bestMatches: [], message: 'Empty after cleaning.' };
		}

		const { data, error } = await ctx.supabase.rpc('match_ingredient', {
			query_text: cleanedText,
			lang_code: effectiveLang,
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

	// Hydrate: fetch the full ingredient details (+ translations) for every
	// matched id, then map them back onto the RPC matches.
	const ingredientIds = Array.from(
		new Set(matches.flatMap((m) => m.bestMatches.map((i: MatchRow) => i.id)))
	);

	if (ingredientIds.length === 0) {
		return { matches: matches.map((m) => ({ ...m, bestMatches: [] })) };
	}

	const { data: enriched, error: enrichedError } = await ctx.supabase
		.from('ingredients')
		.select(
			`*,
			translations:ingredient_translations(*, language:languages!inner(*))
			`
		)
		.in('id', ingredientIds)
		.eq('translations.language.lang', effectiveLang);

	if (enrichedError || !enriched) {
		throw new OpError('INTERNAL', 'Failed to enrich ingredient matches.', enrichedError);
	}

	const byId = new Map(enriched.map((item) => [item.id, item]));
	return {
		matches: matches.map((m) => ({
			...m,
			// Filter out any unmatched IDs
			bestMatches: m.bestMatches.flatMap((raw: MatchRow) => {
				const found = byId.get(raw.id);
				return found ? [found] : [];
			})
		}))
	};
}

export type MatchIngredientsResult = Awaited<ReturnType<typeof matchIngredientsHandler>>;

/**
 * `ingredients.match` — fuzzy-match raw ingredient strings against the
 * ingredients table via the `match_ingredient` RPC (10 candidates each),
 * then hydrate every matched id with its full ingredient row + translations.
 *
 * RPC body moved verbatim from
 * `src/lib/features/ingredients/server/match-ingredients.remote.ts`
 * (`getRequestEvent().locals.supabase` becomes `ctx.supabase`; preprocessing
 * lives in `./match-helpers.ts`). Hydration moved verbatim from
 * `src/lib/features/recipes/modules/parse-ingredients/match.ts`
 * (same `ingredients` + `translations.language.lang` query). Return shape
 * `{ matches }` is preserved 1:1, including per-item error swallowing
 * (empty-after-cleaning and RPC failures yield `{ bestMatches: [], message }`
 * items, never throws) — only the hydration query failure throws (`OpError`
 * INTERNAL), which client wrappers translate back to `{ data: null, error }`.
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
	handler: matchIngredientsHandler
});
