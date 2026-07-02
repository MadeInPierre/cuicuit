import { supabase } from '$lib/shared/db/supabase-client.svelte';

export function getLanguageId(lang: string) {
	return supabase.from('languages').select('*').or(`code.eq.${lang}, lang.eq.${lang}`).single();
}
