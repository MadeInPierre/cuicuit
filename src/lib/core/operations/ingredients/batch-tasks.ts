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
 * PACKING: to amortize the system prompt (~150 tokens) across ingredients,
 * up to `batchSize` ingredients (same language) share ONE request
 * (default 10: 1300 ingredients × 1 lang = 130 requests). Each ingredient
 * gets a numeric `ref` echoed back in `{"results": [{"ref", ...fields}]}`.
 * Per-item salvage (`parseGroupPayload`) means one bad item never kills
 * its group. `batchSize: 1` reproduces the original one-per-request shape.
 *
 * TO EXTEND (new column, new enum, re-inference with a different prompt):
 * 1. Add one entry to `BATCH_TASKS` below (`sourcePayload` + `wanted` +
 *    output schema — packing, chunking and salvage come for free).
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

/** Ingredients packed into one LLM request (1–20, default 10). */
export const batchSizeSchema = z.number().int().min(1).max(20).default(10);

export type BatchSize = z.infer<typeof batchSizeSchema>;

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
	/** Columns requested from the model (also sent as `wanted`). */
	wanted: string[];
	/**
	 * Per-field type hints sent as `field_hints` (enums especially: packed
	 * requests drift toward booleans without them — verified live).
	 */
	fieldHints?: Record<string, string>;
	/** System prompt — shared across all requests of one submitted batch. */
	systemPrompt: string;
	/** Compact per-ingredient payload; single + packed messages derive from it. */
	sourcePayload: (source: BatchSource) => Record<string, unknown>;
	/** Per-request user message for `batchSize: 1`. */
	buildUserMessage: (source: BatchSource, targetLang: string) => string;
	/** Per-request user message for a packed group (same language). */
	buildGroupUserMessage: (entries: Array<{ ref: number; source: BatchSource }>, targetLang: string) => string;
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
- NEVER leave a required field empty; transliterate rather than returning "".
- Single ingredient: respond with the object directly.
- Several ingredients (each has a numeric ref): respond {"results": [{"ref": <echoed ref>, ...fields}]} with exactly one entry per input ref.`;

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

function namesPayload(source: BatchSource): Record<string, unknown> {
	return {
		slug: source.slug,
		aisle: source.aisle,
		name_singular: source.sourceNameSingular,
		name_plural: source.sourceNamePlural,
		name_general: source.sourceNameGeneral
	};
}

function fullPayload(source: BatchSource): Record<string, unknown> {
	return { ...namesPayload(source), commonly_used_hint: source.sourceCommonlyUsed };
}

function messageBase(
	task: BatchTaskDef,
	targetLang: string
): Record<string, unknown> {
	return {
		target_lang: targetLang,
		source_lang: 'en-US',
		wanted: task.wanted,
		...(task.fieldHints ? { field_hints: task.fieldHints } : {})
	};
}

function defaultSingleMessage(task: BatchTaskDef, source: BatchSource, targetLang: string): string {
	return JSON.stringify({
		...messageBase(task, targetLang),
		ingredient: task.sourcePayload(source)
	});
}

function defaultGroupMessage(
	task: BatchTaskDef,
	entries: Array<{ ref: number; source: BatchSource }>,
	targetLang: string
): string {
	return JSON.stringify({
		...messageBase(task, targetLang),
		ingredients: entries.map((e) => ({ ref: e.ref, ...task.sourcePayload(e.source) }))
	});
}

function makeTask(task: Omit<BatchTaskDef, 'buildUserMessage' | 'buildGroupUserMessage'>): BatchTaskDef {
	return {
		...task,
		buildUserMessage: (source, targetLang) =>
			defaultSingleMessage(task as BatchTaskDef, source, targetLang),
		buildGroupUserMessage: (entries, targetLang) =>
			defaultGroupMessage(task as BatchTaskDef, entries, targetLang)
	};
}

export const BATCH_TASKS: Record<BatchTaskId, BatchTaskDef> = {
	'translation.full': makeTask({
		id: 'translation.full',
		label: 'Full translation (names + usage)',
		description:
			'Creates or refreshes all translation columns at once — one packed LLM call per ~10 ingredients × language.',
		fields: ['name_singular', 'name_plural', 'name_general', 'commonly_used'],
		wanted: ['name_singular', 'name_plural', 'name_general', 'commonly_used'],
		fieldHints: { commonly_used: 'must be exactly one of: daily, common, occasionally, rare, never' },
		systemPrompt: TRANSLATION_SYSTEM,
		sourcePayload: fullPayload,
		outputSchema: translationFullOutput
	}),
	'translation.names': makeTask({
		id: 'translation.names',
		label: 'Names only',
		description: 'Re-infers name_singular/plural/general without touching commonly_used.',
		fields: ['name_singular', 'name_plural', 'name_general'],
		wanted: ['name_singular', 'name_plural', 'name_general'],
		systemPrompt: TRANSLATION_SYSTEM,
		sourcePayload: namesPayload,
		outputSchema: translationNamesOutput
	}),
	'translation.commonly_used': makeTask({
		id: 'translation.commonly_used',
		label: 'Usage level only',
		description:
			'Re-infers commonly_used (e.g. after the enum changes) without touching names.',
		fields: ['commonly_used'],
		wanted: ['commonly_used'],
		fieldHints: { commonly_used: 'must be exactly one of: daily, common, occasionally, rare, never' },
		systemPrompt: TRANSLATION_SYSTEM,
		sourcePayload: (source) => ({
			slug: source.slug,
			aisle: source.aisle,
			name_general: source.sourceNameGeneral
		}),
		outputSchema: translationCommonlyUsedOutput
	})
};

export function getBatchTask(id: BatchTaskId): BatchTaskDef {
	return BATCH_TASKS[id];
}

/** Shared input fragment: task + target languages + packing. */
export const batchTargetSchema = z.object({
	taskId: batchTaskIdSchema,
	targetLangs: z.array(languageCodeSchema).min(1).max(20),
	batchSize: batchSizeSchema
});

export type BatchTarget = z.infer<typeof batchTargetSchema>;

/** One reviewed result row, as returned for UI review and accepted by apply. */
export const batchResultRowSchema = z.object({
	ingredientId: z.string().uuid(),
	lang: languageCodeSchema,
	data: z.record(z.string(), z.unknown())
});

export type BatchResultRow = z.infer<typeof batchResultRowSchema>;

/* ---------------- Packing ---------------- */

/** One ingredient × language pair waiting to be packed. */
export interface BatchPair {
	ingredientId: string;
	lang: string;
	source: BatchSource;
}

/** One LLM request: same-language pairs sharing a `custom_id`. */
export interface BatchGroup {
	index: number;
	lang: string;
	pairs: BatchPair[];
}

/**
 * Deterministically packs sources × langs into monolingual groups of
 * `batchSize` (sources in input order, one language per request — better
 * for the model). Chunking is pure, so `batch-status` rebuilds the exact
 * same groups from `{ ingredientIds, targetLangs, batchSize }` with no
 * server-side job table.
 */
export function chunkPairs(
	sources: BatchSource[],
	langs: string[],
	batchSize: number
): BatchGroup[] {
	const size = Math.max(1, Math.min(20, Math.floor(batchSize)));
	const groups: BatchGroup[] = [];
	let index = 0;
	for (const lang of langs) {
		for (let i = 0; i < sources.length; i += size) {
			groups.push({
				index: index++,
				lang,
				pairs: sources.slice(i, i + size).map((source) => ({
					ingredientId: source.ingredientId,
					lang,
					source
				}))
			});
		}
	}
	return groups;
}

/** `custom_id` for a packed group: `pack:<index>`. */
export function encodeGroupId(index: number): string {
	return `pack:${index}`;
}

export function decodeGroupId(customId: string): number | null {
	const match = /^pack:(\d+)$/.exec(customId.trim());
	if (!match) return null;
	const index = Number(match[1]);
	return Number.isSafeInteger(index) ? index : null;
}

/** Per-item salvage result: one bad item never kills its group. */
export interface BatchParsedRow {
	ingredientId: string;
	lang: string;
	data: Record<string, unknown>;
	error: string | null;
}

const groupEnvelopeSchema = z.object({
	results: z.array(z.record(z.string(), z.unknown()))
});

/**
 * Validates a packed group payload (`{"results": [{"ref", ...}]}`) item by
 * item against the task schema. Missing refs, unknown refs and invalid
 * items become per-pair errors; valid siblings still pass.
 */
export function parseGroupPayload(
	json: unknown,
	task: BatchTaskDef,
	group: BatchGroup
): BatchParsedRow[] {
	const byRef = new Map(group.pairs.map((p, i) => [i, p]));
	const envelope = groupEnvelopeSchema.safeParse(json);
	if (!envelope.success) {
		return group.pairs.map((p) => ({
			ingredientId: p.ingredientId,
			lang: p.lang,
			data: {},
			error: 'Group output failed validation.'
		}));
	}
	const seen = new Set<number>();
	const rows: BatchParsedRow[] = [];
	for (const entry of envelope.data.results) {
		const ref = entry.ref;
		const pair = typeof ref === 'number' && Number.isInteger(ref) ? byRef.get(ref) : undefined;
		if (!pair || seen.has(ref as number)) continue;
		seen.add(ref as number);
		const item = { ...entry };
		delete item.ref;
		const parsed = task.outputSchema.safeParse(item);
		if (!parsed.success) {
			rows.push({ ingredientId: pair.ingredientId, lang: pair.lang, data: {}, error: 'Item failed validation.' });
		} else {
			rows.push({
				ingredientId: pair.ingredientId,
				lang: pair.lang,
				data: parsed.data as Record<string, unknown>,
				error: null
			});
		}
	}
	for (const [ref, pair] of byRef) {
		if (!seen.has(ref)) {
			rows.push({
				ingredientId: pair.ingredientId,
				lang: pair.lang,
				data: {},
				error: 'Missing from group output.'
			});
		}
	}
	// Stable order: input order, so review grids don't jump around.
	rows.sort((a, b) => {
		const ai = group.pairs.findIndex((p) => p.ingredientId === a.ingredientId);
		const bi = group.pairs.findIndex((p) => p.ingredientId === b.ingredientId);
		return ai - bi;
	});
	return rows;
}
