import { matchIngredientsRPC } from '$lib/features/ingredients/server/match-ingredients.remote';
import type { RecipeIngredientWithTranslations } from '$lib/features/recipes/queries/get-recipe-detailed';
import { supabase } from '$lib/shared/db/supabase-client.svelte';

export type MatchIngredientsResponse = {
	matches: {
		originalText: string;
		message: string;
		bestMatches: RecipeIngredientWithTranslations[];
	}[];
} | null;

export async function matchIngredients(ingredientStrings: string[], lang: string) {
	if (!supabase.client) throw new Error('No supabase client');

	const { matches } = await matchIngredientsRPC({ ingredientStrings, lang });

	// Step 2: Get the unique ingredient IDs from the matches and fetch their full details from the database
	const ingredientIds = Array.from(new Set(matches.flatMap((m) => m.bestMatches.map((i) => i.id))));

	if (ingredientIds.length === 0) {
		return {
			data: {
				matches: matches.map((m) => ({ ...m, bestMatches: [] }))
			},
			error: null
		};
	}

	const { data: enriched, error: enrichedError } = await supabase.client
		.from('ingredients')
		.select(
			`*,
			translations:ingredient_translations(*, language:languages!inner(*))
			`
		)
		.in('id', ingredientIds)
		.eq('translations.language.lang', lang);

	// TODO use ingredient substitutions?
	// substitutes:ingredient_substitutions!ingredient_substitutions_original_ingredient_id_fkey(
	// 	*,
	// 	original_ingredient:ingredients!ingredient_substitutions_original_ingredient_id_fkey(*,
	// 		translations:ingredient_translations(*, language:languages!inner(*))
	// 	),
	// 	substitute_ingredient:ingredients!ingredient_substitutions_substitute_ingredient_id_fkey(*,
	// 		translations:ingredient_translations(*, language:languages!inner(*))
	// 	)
	// )
	// .eq('substitutes.original_ingredient.translations.language.lang', lang)
	// .eq('substitutes.substitute_ingredient.translations.language.lang', lang);

	if (enrichedError || !enriched) {
		return {
			data: null,
			error: enrichedError ?? new Error('Failed to enrich ingredient matches')
		};
	}

	// Step 3: Map the enriched ingredient details back to the original matches
	const byId = new Map(enriched.map((item) => [item.id, item]));
	const hydrated = {
		matches: matches.map((m) => ({
			...m,
			bestMatches: m.bestMatches.map((raw) => byId.get(raw.id)).filter((i) => !!i) // Filter out any unmatched IDs
		}))
	};

	return { data: hydrated as MatchIngredientsResponse, error: null };
}
