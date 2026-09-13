import type { LanguageKey } from '$lib/features/user-settings/consts';
import type { Database } from '$lib/shared/db/supabase.types';
import type { SupabaseClient } from '@supabase/supabase-js';

// M2: canonical home of `getLanguageId` (moved from
// `features/recipes/queries/get-language-id.ts`, which re-exports this).
// Co-located helper, not an op.
export function getLanguageId(supabase: SupabaseClient<Database>, lang: LanguageKey) {
	return supabase.from('languages').select('*').or(`code.eq.${lang}, lang.eq.${lang}`).single();
}
