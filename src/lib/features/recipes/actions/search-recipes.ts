import { supabase } from '$lib/shared/db/supabase-client.svelte';

export function searchRecipes(query: string) {
	return supabase.from('recipes').select('*').textSearch('title', query);
}
