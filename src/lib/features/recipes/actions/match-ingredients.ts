import { supabase } from '$lib/shared/db/supabase-client';
import type { Database } from 'lucide-svelte';

export type MatchIngredientsResponse = {
	matches: {
		originalText: string;
		bestMatches: {
			commonly_used: Database['public']['Enums']['commonly_used_level'];
			fts: unknown | null;
			ingredient_id: string;
			language_id: number;
			name_general: string;
			name_plural: string | null;
			name_singular: string | null;
		}[];
	}[];
} | null;

export async function matchIngredients(searchInput: string, lang: string) {
	if (!supabase) {
		console.error('Supabase client not available');
		return;
	}

	console.log('Matching ingredients:', searchInput, lang);
	const response = await supabase.functions.invoke<MatchIngredientsResponse>('match-ingredients', {
		body: {
			ingredients: [searchInput],
			lang: lang
		}
	});

	console.log('Matched:', response);
	return response;
}
