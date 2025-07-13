import { supabase } from '$lib/shared/db/supabase-client';

export function getLanguageId(lang: string) {
	return supabase.from('languages').select('id').eq('lang', lang).single();
}
