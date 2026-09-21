import { describe, expect, it } from 'vitest';

import {
	BATCH_TASKS,
	batchTaskIds,
	chunkPairs,
	decodeGroupId,
	encodeGroupId,
	getBatchTask,
	parseGroupPayload,
	type BatchSource
} from './batch-tasks.js';
import {
	buildChatBody,
	buildJsonl,
	extractLineContent,
	parseOutputLines,
	stripFences,
	BATCH_ENDPOINT
} from './mistral-batch.js';

/**
 * M4 batch unit tests — pure functions only, no network, no DB.
 * Live inference is covered by a one-off spot-check (see below), not CI.
 */

const SOURCE: BatchSource = {
	ingredientId: '11111111-1111-4111-8111-111111111111',
	slug: 'red-apple',
	slugGeneral: 'apple',
	aisle: 'fruits-vegetables',
	sourceNameSingular: 'red apple',
	sourceNamePlural: 'red apples',
	sourceNameGeneral: 'red apples',
	sourceCommonlyUsed: 'common'
};

describe('batch task registry', () => {
	it('every task has a prompt, schema and writable fields', () => {
		for (const id of batchTaskIds) {
			const task = getBatchTask(id);
			expect(task.id).toBe(id);
			expect(task.label.length).toBeGreaterThan(0);
			expect(task.fields.length).toBeGreaterThan(0);
			expect(task.systemPrompt).toContain('JSON');
			const msg = task.buildUserMessage(SOURCE, 'fr-FR');
			expect(msg).toContain('fr-FR');
			// Compact: 2000 requests must stay cheap.
			expect(msg.length).toBeLessThan(1000);
		}
	});

	it('translation.full validates a good payload and rejects an empty one', () => {
		const task = BATCH_TASKS['translation.full'];
		expect(
			task.outputSchema.safeParse({
				name_singular: 'pomme rouge',
				name_plural: 'pommes rouges',
				name_general: 'pommes rouges',
				commonly_used: 'common'
			}).success
		).toBe(true);
		expect(task.outputSchema.safeParse({ name_general: '' }).success).toBe(false);
	});

	it('translation.commonly_used writes only its own column', () => {
		expect(BATCH_TASKS['translation.commonly_used'].fields).toEqual(['commonly_used']);
	});

	it('group custom_id round-trips', () => {
		expect(decodeGroupId(encodeGroupId(7))).toBe(7);
		expect(decodeGroupId('pack:0')).toBe(0);
		expect(decodeGroupId('a:fr-FR')).toBeNull();
		expect(decodeGroupId('pack:xx')).toBeNull();
	});
});

describe('packing', () => {
	const twoSources: BatchSource[] = [
		SOURCE,
		{ ...SOURCE, ingredientId: '22222222-2222-4222-8222-222222222222', slug: 'banana' }
	];

	it('chunks monolingually with deterministic indexes', () => {
		const groups = chunkPairs(twoSources, ['fr-FR', 'es-ES'], 1);
		expect(groups).toHaveLength(4);
		expect(groups.map((g) => g.index)).toEqual([0, 1, 2, 3]);
		// Same language per request, sources in input order.
		expect(groups[0]).toMatchObject({ lang: 'fr-FR', pairs: [{ lang: 'fr-FR' }] });
		expect(groups[0].pairs[0].ingredientId).toBe(twoSources[0].ingredientId);
		expect(groups[2].lang).toBe('es-ES');
		// Re-chunking rebuilds identical groups (stateless status op).
		expect(chunkPairs(twoSources, ['fr-FR', 'es-ES'], 1)).toEqual(groups);
	});

	it('packs several ingredients into one request', () => {
		const groups = chunkPairs(twoSources, ['fr-FR'], 10);
		expect(groups).toHaveLength(1);
		const task = BATCH_TASKS['translation.full'];
		const msg = task.buildGroupUserMessage(
			groups[0].pairs.map((p, i) => ({ ref: i, source: p.source })),
			'fr-FR'
		);
		const parsed = JSON.parse(msg) as { ingredients: Array<{ ref: number }> };
		expect(parsed.ingredients.map((i) => i.ref)).toEqual([0, 1]);
		// Still compact: shared system prompt amortized over the group.
		expect(msg.length).toBeLessThan(1000);
	});

	it('sends enum hints so packed requests keep schema adherence', () => {
		const task = BATCH_TASKS['translation.full'];
		const msg = task.buildGroupUserMessage([{ ref: 0, source: SOURCE }], 'fr-FR');
		const parsed = JSON.parse(msg) as { field_hints?: Record<string, string> };
		expect(parsed.field_hints?.commonly_used).toContain('daily');
	});

	it('salvages valid siblings when one item is bad', () => {
		const task = BATCH_TASKS['translation.full'];
		const groups = chunkPairs(twoSources, ['fr-FR'], 10);
		const good = {
			ref: 0,
			name_singular: 'pomme rouge',
			name_plural: 'pommes rouges',
			name_general: 'pommes rouges',
			commonly_used: 'common'
		};
		const rows = parseGroupPayload({ results: [good, { ref: 1, name_general: '' }] }, task, groups[0]);
		expect(rows).toHaveLength(2);
		expect(rows.find((r) => r.ingredientId === twoSources[0].ingredientId)?.error).toBeNull();
		expect(rows.find((r) => r.ingredientId === twoSources[1].ingredientId)?.error).not.toBeNull();
	});

	it('reports missing refs and rejects bad envelopes per pair', () => {
		const task = BATCH_TASKS['translation.names'];
		const groups = chunkPairs(twoSources, ['fr-FR'], 10);
		const missing = parseGroupPayload({ results: [] }, task, groups[0]);
		expect(missing.every((r) => r.error !== null)).toBe(true);
		const broken = parseGroupPayload({ nope: true }, task, groups[0]);
		expect(broken).toHaveLength(2);
		expect(broken.every((r) => r.error !== null)).toBe(true);
	});
});

describe('mistral batch helpers', () => {
	it('builds chat bodies for the chat endpoint with JSON mode', () => {
		const body = buildChatBody('sys', '{"a":1}', 'mistral-small-latest');
		expect(body.model).toBe('mistral-small-latest');
		expect((body.response_format as { type: string }).type).toBe('json_object');
		expect(BATCH_ENDPOINT).toBe('/v1/chat/completions');
	});

	it('builds parseable JSONL and parses output lines back', () => {
		const jsonl = buildJsonl([
			{ custom_id: 'a:fr-FR', body: { x: 1 } },
			{ custom_id: 'b:fr-FR', body: { x: 2 } }
		]);
		expect(jsonl.endsWith('\n')).toBe(true);
		expect(jsonl.trim().split('\n')).toHaveLength(2);

		const out = [
			JSON.stringify({
				custom_id: 'a:fr-FR',
				response: { status_code: 200, body: { choices: [{ message: { content: '{"ok":true}' } }] } }
			}),
			JSON.stringify({ custom_id: 'b:fr-FR', error: 'overloaded' }),
			'not-json{{{'
		].join('\n');
		const lines = parseOutputLines(out);
		// Malformed line skipped.
		expect(lines).toHaveLength(2);
		expect(extractLineContent(lines[0])).toEqual({ json: { ok: true } });
		const err = extractLineContent(lines[1]) as { error: string };
		expect(err.error.length).toBeGreaterThan(0);
	});

	it('tolerates fences, string bodies and non-200 statuses', () => {
		const fenced = {
			custom_id: 'pack:0',
			response: {
				status_code: 200,
				body: { choices: [{ message: { content: '```json\n{"a":1}\n```' } }] }
			}
		};
		expect(extractLineContent(fenced)).toEqual({ json: { a: 1 } });
		expect(stripFences('{"a":1}')).toBe('{"a":1}');

		const stringBody = {
			custom_id: 'pack:0',
			response: { status_code: 200, body: '{"choices":[{"message":{"content":"{\\"a\\":2}"}}]}' }
		};
		expect(extractLineContent(stringBody)).toEqual({ json: { a: 2 } });

		const failed = {
			custom_id: 'pack:0',
			response: { status_code: 429, body: { message: 'rate limited' } }
		};
		const err = extractLineContent(failed) as { error: string };
		expect(err.error).toContain('429');
	});
});

describe('live batch shape regressions', () => {
	// Captured verbatim from a real Mistral batch output file: the model
	// collapsed a 4-item group into a single object (ref 0 only) instead of
	// {"results": [...]}. The pipeline must salvage ref 0 and flag the rest
	// as missing — never fail the whole group.
	const LIVE_LINE =
		'{"id":"batch-d6013397-ace12a30-0","custom_id":"pack:0","response":{"status_code":200,"body":{"id":"b33c35d091434a4f8e0182a1446f173d","object":"chat.completion","model":"mistral-small-latest","usage":{"prompt_tokens":488,"completion_tokens":37,"total_tokens":525},"created":1789937140,"choices":[{"index":0,"finish_reason":"stop","message":{"role":"assistant","content":"{\\"ref\\":0,\\"name_singular\\":\\"Apfel\\",\\"name_plural\\":\\"Äpfel\\",\\"name_general\\":\\"Äpfel\\",\\"commonly_used\\":\\"common\\" }","tool_calls":null}}]}},"error":null}';

	const fourSources: BatchSource[] = [0, 1, 2, 3].map((i) => ({
		...SOURCE,
		ingredientId: `1111111${i}-1111-4111-8111-11111111111${i}`,
		slug: `ingredient-${i}`
	}));

	it('salvages the single returned item and flags the missing three', () => {
		const task = BATCH_TASKS['translation.full'];
		const groups = chunkPairs(fourSources, ['de-DE'], 10);
		expect(groups).toHaveLength(1);

		const lines = parseOutputLines(LIVE_LINE + '\n');
		expect(lines).toHaveLength(1);
		const extracted = extractLineContent(lines[0]);
		expect('json' in extracted).toBe(true);
		if (!('json' in extracted)) throw new Error('unreachable');

		const rows = parseGroupPayload(extracted.json, task, groups[0]);
		expect(rows).toHaveLength(4);
		const good = rows.filter((r) => !r.error);
		const missing = rows.filter((r) => r.error);
		expect(good).toHaveLength(1);
		expect(good[0]).toMatchObject({
			ingredientId: fourSources[0].ingredientId,
			lang: 'de-DE',
			data: { name_general: 'Äpfel', commonly_used: 'common' }
		});
		expect(missing).toHaveLength(3);
		expect(missing.every((r) => r.error === 'Missing from group output.')).toBe(true);
	});

	it('accepts a bare array and coerces string refs', () => {
		const task = BATCH_TASKS['translation.names'];
		const groups = chunkPairs(fourSources.slice(0, 2), ['de-DE'], 10);
		const rows = parseGroupPayload(
			[
				{ ref: '0', name_singular: 'Apfel', name_plural: 'Äpfel', name_general: 'Äpfel' },
				{ ref: '1', name_singular: 'Birne', name_plural: 'Birnen', name_general: 'Birnen' }
			],
			task,
			groups[0]
		);
		expect(rows.filter((r) => !r.error)).toHaveLength(2);
	});
});
