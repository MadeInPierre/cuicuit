import {
	CURATED_LANGUAGES,
	languageCodeSchema,
	type LanguageCode
} from '$lib/shared/language.js';

// UI-facing re-exports — the canonical definitions live in
// `$lib/shared/language.ts`. `id` is DB-internal; the UI keeps a static
// mirror only for legacy lookups (new code should use `lang` + resolver).
export const languages = {
	'en-US': { ...CURATED_LANGUAGES['en-US'], id: 1 },
	'fr-FR': { ...CURATED_LANGUAGES['fr-FR'], id: 2 },
	'es-ES': { ...CURATED_LANGUAGES['es-ES'], id: 3 },
	'pt-BR': { ...CURATED_LANGUAGES['pt-BR'], id: 4 }
} as const;

export const languageKeySchema = languageCodeSchema;

export type LanguageKey = LanguageCode;
