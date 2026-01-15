import { supabase } from '$lib/shared/db/supabase-client';
import type { Tables } from '$lib/shared/db/supabase.types';

export type IngredientMatch = Tables<'ingredient_translations'>;

export type MatchIngredientsResponse = {
	matches: {
		originalText: string;
		message: string;
		bestMatches: IngredientMatch[];
	}[];
} | null;

export async function matchIngredients(ingredientStrings: string[], lang: string) {
	if (!supabase) {
		throw new Error('Supabase client not available');
	}

	const response = await supabase.functions.invoke<MatchIngredientsResponse>('match-ingredients', {
		body: { ingredients: ingredientStrings, lang: lang }
	});

	return response;
}
