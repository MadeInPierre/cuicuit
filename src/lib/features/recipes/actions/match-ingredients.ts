import { supabase } from '$lib/shared/db/supabase-client';

export function matchIngredients(searchInput: string, lang: string) {
	return supabase.functions.invoke('match-ingredients', {
		body: {
			ingredients: [searchInput],
			lang: lang
		}
	});
}
