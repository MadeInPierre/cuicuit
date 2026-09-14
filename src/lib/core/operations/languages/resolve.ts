import type { SupabaseClient } from '@supabase/supabase-js';

import { normalizeLanguageCode, type LanguageCode } from '$lib/shared/language.js';
import type { Database } from '$lib/shared/db/supabase.types';

import { OpError } from '../errors.js';

/**
 * Resolve a public `lang` code to the internal `languages.id`.
 * Accepts forgiving variants (`'en-us'` → `'en-US'`). Throws VALIDATION when
 * malformed, NOT_FOUND when well-formed but missing from the DB.
 */
export async function resolveLanguageId(
	supabase: SupabaseClient<Database>,
	lang: string
): Promise<{ id: number; lang: LanguageCode }> {
	const normalized = normalizeLanguageCode(lang);
	if (!normalized) {
		throw new OpError('VALIDATION', `Unknown language: ${String(lang)}.`);
	}
	const { data, error } = await supabase
		.from('languages')
		.select('id, lang')
		.eq('lang', normalized)
		.single();
	if (error || !data) {
		throw new OpError('NOT_FOUND', `Language not found: ${normalized}.`, error);
	}
	return { id: data.id, lang: data.lang as LanguageCode };
}
