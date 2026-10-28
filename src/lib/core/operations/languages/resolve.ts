import type { SupabaseClient } from '@supabase/supabase-js';

import { normalizeLanguageCode, type LanguageCode } from '$lib/shared/language.js';
import type { Database } from '$lib/shared/db/supabase.types';

import { OpError } from '../errors.js';

async function findLanguage(
	supabase: SupabaseClient<Database>,
	lang: LanguageCode
): Promise<{ id: number; lang: LanguageCode } | null> {
	const { data, error } = await supabase
		.from('languages')
		.select('id, lang')
		.eq('lang', lang)
		.maybeSingle();
	if (error || !data) return null;
	return { id: data.id, lang: data.lang as LanguageCode };
}

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
	const found = await findLanguage(supabase, normalized);
	if (!found) {
		throw new OpError('NOT_FOUND', `Language not found: ${normalized}.`);
	}
	return found;
}

/**
 * Resolve a recipe's language, creating a minimal `languages` row when the LLM
 * detects a well-formed code the app does not ship yet. Only used by imports
 * (admin client), where unknown languages legitimately enter the database.
 */
export async function resolveOrCreateLanguageId(
	supabase: SupabaseClient<Database>,
	lang: string
): Promise<{ id: number; lang: LanguageCode }> {
	const normalized = normalizeLanguageCode(lang);
	if (!normalized) {
		throw new OpError('VALIDATION', `Unknown language: ${String(lang)}.`);
	}

	const found = await findLanguage(supabase, normalized);
	if (found) return found;

	const [language = '', region = ''] = normalized.split('-');
	const displayName = (locale: string, type: 'language' | 'region', code: string) =>
		new Intl.DisplayNames([locale], { type }).of(code) ?? normalized;

	const { data, error } = await supabase
		.from('languages')
		.insert({
			code: language.toLowerCase(),
			lang: normalized,
			name_en: displayName('en', 'language', language),
			name_local: displayName(language, 'language', language),
			country_en: displayName('en', 'region', region),
			country_local: displayName(language, 'region', region)
		})
		.select('id, lang')
		.single();

	if (data) return { id: data.id, lang: data.lang as LanguageCode };

	// Another import may have inserted the same language concurrently.
	const raced = await findLanguage(supabase, normalized);
	if (raced) return raced;
	throw new OpError('INTERNAL', `Failed to create language: ${normalized}.`, error);
}
