import { z } from 'zod';

import { languageCodeSchema } from '$lib/shared/language.js';

import { commonlyUsedSchema } from './admin-schemas.js';

/**
 * Generalized AI batch task registry (M4).
 *
 * The batch pipeline works on "one task × N ingredients × M languages".
 * A task = a named subset of `ingredient_translations` columns + a prompt
 * builder + an output schema + the list of DB columns it writes.
 *
 * TO EXTEND (new column, new enum, re-inference with a different prompt):
 * 1. Add one entry to `BATCH_TASKS` below (fields + prompt + output schema).
 * 2. Nothing else changes — the ops (`batch-run-inline`, `batch-submit`,
 *    `batch-status`, `batch-apply`) and the admin UI iterate this registry.
 *
 * Browser-safe: no server imports (`$app/server`, `$env`, Supabase) so the
 * admin UI can import task labels directly. Server-only helpers
 * (Mistral HTTP client) live in `mistral-batch.ts`.
 */

export const batchTaskIds = ['translation.full', 'translation.names', 'translation.commonly_used'] as const;

export type BatchTaskId = (typeof batchTaskIds)[number];

export const batchTaskIdSchema = z.enum(batchTaskIds);

/** Columns of `ingredient_translations` a task is allowed to write. */
export const batchTranslationFieldSchema = z.enum([
	'name_singular',
	'name_plural',
	'name_general',
	'commonly_used'
]);

export type BatchTranslationField = z.infer<typeof batchTranslationFieldSchema>;

/** Source text fed to the LLM for one ingredient (resolved server-side). */
export interface BatchSource {
	ingredientId: string;
	slug: string;
	slugGeneral: string;
	aisle: string | null;
	/** English reference names (or first available translation as fallback). */
	sourceNameSingular: string | null;
	sourceNamePlural: string | null;
	sourceNameGeneral: string;
	sourceCommonlyUsed: string | null;
}

export interface BatchTaskDef {
	id: BatchTaskId;
	label: string;
	description: string;
	/** DB columns this task writes via `ingredients.batch-apply`. */
	fields: BatchTranslationField[];
	/** System prompt — shared across all requests of one submitted batch. */
	systemPrompt: string;
	/** Per-request user message. Keep it compact: 2000 requests × tokens. */
	buildUserMessage: (source: BatchSource, targetLang: string) => string;
	/** Validates one LLM result object before review/apply. */
	outputSchema: z.ZodType<Record<string, unknown>>;
}

const TRANSLATION_SYSTEM = `You are a professional food translator. Translate the given ingredient name(s) into the requested language.
Rules:
- Respond with RAW JSON only, no extra text, no markdown fences.
- Use the culinary term a home cook would search for in a grocery store (not a literal dictionary translation).
- name_general: the everyday search/display form (usually plural or mass noun as locals write it).
- name_singular / name_plural: grammatical singular and plural forms; null only if the language has no such distinction for this word.
- commonly_used: how often home cooks in that language-region use this ingredient (daily/common/occasionally/rare/never).
- NEVER leave a required field empty; transliterate rather than returning "".`;

const translationFullOutput = z.object({
	name_singular: z.string().min(1).nullable(),
	name_plural: z.string().min(1).nullable(),
	name_general: z.string().min(1),
	commonly_used: commonlyUsedSchema
});

const translationNamesOutput = z.object({
	name_singular: z.string().min(1).nullable(),
	name_plural: z.string().min(1).nullable(),
	name_general: z.string().min(1)
});

const translationCommonlyUsedOutput = z.object({
	commonly_used: commonlyUsedSchema
});

function namesUserMessage(source: BatchSource, targetLang: string): string {
	return JSON.stringify({
		target_lang: targetLang,
		source_lang: 'en-US',
		ingredient: {
			slug: source.slug,
			aisle: source.aisle,
			name_singular: source.sourceNameSingular,
			name_plural: source.sourceNamePlural,
			name_general: source.sourceNameGeneral
		},
		wanted: ['name_singular', 'name_plural', 'name_general']
	});
}

export const BATCH_TASKS: Record<BatchTaskId, BatchTaskDef> = {
	'translation.full': {
		id: 'translation.full',
		label: 'Full translation (names + usage)',
		description:
			'Creates or refreshes all translation columns at once — one LLM call per ingredient × language.',
		fields: ['name_singular', 'name_plural', 'name_general', 'commonly_used'],
		systemPrompt: TRANSLATION_SYSTEM,
		buildUserMessage: (source, targetLang) =>
			JSON.stringify({
				target_lang: targetLang,
				source_lang: 'en-US',
				ingredient: {
					slug: source.slug,
					aisle: source.aisle,
					name_singular: source.sourceNameSingular,
					name_plural: source.sourceNamePlural,
					name_general: source.sourceNameGeneral,
					commonly_used_hint: source.sourceCommonlyUsed
				},
				wanted: ['name_singular', 'name_plural', 'name_general', 'commonly_used']
			}),
		outputSchema: translationFullOutput
	},
	'translation.names': {
		id: 'translation.names',
		label: 'Names only',
		description: 'Re-infers name_singular/plural/general without touching commonly_used.',
		fields: ['name_singular', 'name_plural', 'name_general'],
		systemPrompt: TRANSLATION_SYSTEM,
		buildUserMessage: namesUserMessage,
		outputSchema: translationNamesOutput
	},
	'translation.commonly_used': {
		id: 'translation.commonly_used',
		label: 'Usage level only',
		description:
			'Re-infers commonly_used (e.g. after the enum changes) without touching names.',
		fields: ['commonly_used'],
		systemPrompt: TRANSLATION_SYSTEM,
		buildUserMessage: (source, targetLang) =>
			JSON.stringify({
				target_lang: targetLang,
				ingredient: {
					slug: source.slug,
					aisle: source.aisle,
					name_general: source.sourceNameGeneral
				},
				wanted: ['commonly_used']
			}),
		outputSchema: translationCommonlyUsedOutput
	}
};

export function getBatchTask(id: BatchTaskId): BatchTaskDef {
	return BATCH_TASKS[id];
}

/** `custom_id` encoding for Mistral batch requests: `<ingredientId>:<lang>`. */
export function encodeCustomId(ingredientId: string, lang: string): string {
	return `${ingredientId}:${lang}`;
}

export function decodeCustomId(customId: string): { ingredientId: string; lang: string } | null {
	const idx = customId.lastIndexOf(':');
	if (idx <= 0 || idx === customId.length - 1) return null;
	return { ingredientId: customId.slice(0, idx), lang: customId.slice(idx + 1) };
}

/** Shared input fragment: task + target languages. */
export const batchTargetSchema = z.object({
	taskId: batchTaskIdSchema,
	targetLangs: z.array(languageCodeSchema).min(1).max(20)
});

export type BatchTarget = z.infer<typeof batchTargetSchema>;

/** One reviewed result row, as returned for UI review and accepted by apply. */
export const batchResultRowSchema = z.object({
	ingredientId: z.string().uuid(),
	lang: languageCodeSchema,
	data: z.record(z.string(), z.unknown())
});

export type BatchResultRow = z.infer<typeof batchResultRowSchema>;
