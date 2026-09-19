import { getClientCtx, runOp } from '$lib/core/operations/client.js';
import type {
	MatchIngredientsInput,
	MatchIngredientsResult
} from '$lib/core/operations/ingredients/match.js';
import type { RecipeIngredientWithTranslations } from '$lib/features/recipes/queries/get-recipe-detailed';
import type { Database } from '$lib/shared/db/supabase.types';
import { DEFAULT_LANGUAGE, type LanguageCode } from '$lib/shared/language.js';
import type { SupabaseClient } from '@supabase/supabase-js';

export type MatchIngredientsResponse = {
	matches: {
		originalText: string;
		message: string;
		bestMatches: RecipeIngredientWithTranslations[];
	}[];
} | null;

/**
 * Thin adapter over the `ingredients.match` op (hardening phase 1b).
 * Same signature, same `{ data, error }` return shape — the RPC + hydration
 * body now lives in the core op. The `supabase` param is kept for signature
 * stability but the op context comes from `getClientCtx()` (all callers pass
 * the same browser singleton; RLS is enforced by that client either way).
 */
export async function matchIngredients(
	supabase: SupabaseClient<Database>,
	ingredientStrings: string[],
	lang: LanguageCode
) {
	try {
		const data = await runOp<MatchIngredientsInput, MatchIngredientsResult>(
			'ingredients.match',
			await getClientCtx(),
			{ ingredientStrings, lang: lang || DEFAULT_LANGUAGE }
		);
		return { data: data as MatchIngredientsResponse, error: null };
	} catch (error) {
		return { data: null, error };
	}
}
