import type { RecipeIngredientWithTranslations } from '$lib/features/recipes/queries/get-recipe-detailed';
import { supabase } from '$lib/shared/db/supabase-client';
import type { Tables } from '$lib/shared/db/supabase.types';

export type MatchIngredientsResponse = {
	matches: {
		originalText: string;
		message: string;
		bestMatches: RecipeIngredientWithTranslations[];
	}[];
} | null;

export async function matchIngredients(
	ingredientStrings: string[],
	lang: string
): Promise<{
	data: MatchIngredientsResponse;
	error: Error | null;
}> {
	if (!supabase) {
		throw new Error('Supabase client not available');
	}

	// Step 1: Call the edge function to get initial matches
	type FunctionResponse = {
		matches: {
			originalText: string;
			message: string;
			bestMatches: Tables<'ingredients'>[];
		}[];
	} | null;

	const response = await supabase.functions.invoke<FunctionResponse>('match-ingredients', {
		body: { ingredients: ingredientStrings, lang: lang }
	});

	if (response.error || !response.data) {
		return {
			data: null,
			error: response.error ?? new Error('Failed to match ingredients')
		};
	}

	// Step 2: Get the unique ingredient IDs from the matches and fetch their full details from the database
	const allIds = Array.from(
		new Set(response.data.matches.flatMap((m) => m.bestMatches.map((i) => i.id)))
	);

	if (allIds.length === 0) {
		return {
			data: {
				...response.data,
				matches: response.data.matches.map((m) => ({ ...m, bestMatches: [] }))
			},
			error: null
		};
	}

	const { data: enriched, error: enrichedError } = await supabase
		.from('ingredients')
		.select(
			`*,
			translations:ingredient_translations(*, language:languages!inner(*)),
			substitutes:ingredient_substitutions!ingredient_substitutions_original_ingredient_id_fkey(
				*,
				original_ingredient:ingredients!ingredient_substitutions_original_ingredient_id_fkey(*,
					translations:ingredient_translations(*, language:languages!inner(*))
				),
				substitute_ingredient:ingredients!ingredient_substitutions_substitute_ingredient_id_fkey(*,
					translations:ingredient_translations(*, language:languages!inner(*))
				)
			)`
		)
		.in('id', allIds)
		.eq('translations.language.lang', lang)
		.eq('substitutes.original_ingredient.translations.language.lang', lang)
		.eq('substitutes.substitute_ingredient.translations.language.lang', lang);

	if (enrichedError || !enriched) {
		return {
			data: null,
			error: enrichedError ?? new Error('Failed to enrich ingredient matches')
		};
	}

	// Step 3: Map the enriched ingredient details back to the original matches
	const byId = new Map(enriched.map((item) => [item.id, item]));
	const hydrated = {
		...response.data,
		matches: response.data.matches.map((m) => ({
			...m,
			bestMatches: m.bestMatches.map((raw) => byId.get(raw.id)).filter((i) => !!i) // Filter out any unmatched IDs
		}))
	};

	return { data: hydrated, error: null };
}
