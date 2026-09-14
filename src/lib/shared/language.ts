import z from 'zod';

/**
 * Canonical language interface (single source of truth).
 *
 * Every public input/output across ops, REST, MCP and the frontend uses
 * `lang: LanguageCode` — a BCP47 key matching `languages.lang` in the DB
 * (e.g. `en-US`). The DB `languages` table is the source of truth for which
 * languages exist; integer `id` and 2-letter `code` are DB-internal and must
 * never appear in public inputs (`code` is ambiguous anyway: `pt` covers
 * both `pt-BR` and `pt-PT`).
 *
 * NOTE: intentionally a plain `string` alias, not a branded type — branded
 * types require a zod `.transform()`, which `z.toJSONSchema` cannot convert,
 * silently blanking every op's MCP/REST input schema. Runtime validation
 * (shape here + existence in `resolveLanguageId`) is the real guarantee and
 * covers all surfaces uniformly.
 */
export type LanguageCode = string;

export const DEFAULT_LANGUAGE: LanguageCode = 'en-US';

const LANG_SHAPE = /^[a-z]{2}-[A-Z]{2}$/;

/**
 * Normalize forgiving user input (`'en-us'`, `'en_us'`, `' fr-FR '`) to
 * canonical `xx-YY` form. Returns `null` when the shape is unrecognized.
 * Bare 2-letter codes (`'en'`) are rejected — they are ambiguous
 * (`pt` → `pt-BR` vs `pt-PT`), so callers must pass the full code.
 */
export function normalizeLanguageCode(input: unknown): LanguageCode | null {
	if (typeof input !== 'string') return null;
	const cleaned = input.trim().replace('_', '-');
	const match = /^([a-zA-Z]{2})-([a-zA-Z]{2})$/.exec(cleaned);
	if (!match) return null;
	const canonical = `${match[1].toLowerCase()}-${match[2].toUpperCase()}`;
	return LANG_SHAPE.test(canonical) ? canonical : null;
}

export function isLanguageCode(input: unknown): input is LanguageCode {
	return normalizeLanguageCode(input) !== null;
}

/**
 * Uniform public language field. Accepts canonical codes plus forgiving
 * variants (`'en-us'` → `'en-US'`) and normalizes to the canonical form.
 * Existence is validated against the DB by `resolveLanguageId`
 * (unknown-but-well-formed codes fail with NOT_FOUND, not here).
 */
export const languageCodeSchema = z.preprocess(
	(v) => normalizeLanguageCode(v) ?? v,
	z.string().regex(LANG_SHAPE, 'Expected a language code like en-US.')
);

/**
 * Curated subset offered by the UI language pickers (label + emoji).
 * The API itself accepts any language present in the DB `languages` table.
 */
export const CURATED_LANGUAGES = {
	'en-US': { label: 'English', emoji: '🇺🇸' },
	'fr-FR': { label: 'Français', emoji: '🇫🇷' },
	'es-ES': { label: 'Español', emoji: '🇪🇸' },
	'pt-BR': { label: 'Português', emoji: '🇧🇷' }
} as const;
