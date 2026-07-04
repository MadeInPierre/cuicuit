import type { LanguageKey } from '$lib/features/user-settings/consts';
import { supabase } from '$lib/shared/db/supabase-client.svelte';

export function getLanguageId(lang: LanguageKey) {
	if (!supabase.client) throw new Error('No supabase client');
	
	return supabase.client
		.from('languages')
		.select('*')
		.or(`code.eq.${lang}, lang.eq.${lang}`)
		.single();
}
