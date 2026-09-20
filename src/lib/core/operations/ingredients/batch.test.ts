import { describe, expect, it } from 'vitest';

import {
	BATCH_TASKS,
	batchTaskIds,
	decodeCustomId,
	encodeCustomId,
	getBatchTask,
	type BatchSource
} from './batch-tasks.js';
import {
	buildChatBody,
	buildJsonl,
	extractLineContent,
	parseOutputLines,
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

	it('custom_id round-trips (UUID contains dashes, never a colon)', () => {
		const id = encodeCustomId(SOURCE.ingredientId, 'pt-BR');
		expect(decodeCustomId(id)).toEqual({ ingredientId: SOURCE.ingredientId, lang: 'pt-BR' });
		expect(decodeCustomId('nocolon')).toBeNull();
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
});
