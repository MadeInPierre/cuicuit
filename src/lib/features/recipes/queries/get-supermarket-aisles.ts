import { supabase } from '$lib/shared/db/supabase-client';

export function getSupermarketAisles() {
	return supabase.from('supermarket_aisles').select().order('aisle', { ascending: true });
}
