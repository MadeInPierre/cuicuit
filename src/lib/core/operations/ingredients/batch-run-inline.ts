import { z } from 'zod';

import { generateText, Output } from 'ai';

import { withLlmFailover } from '$lib/shared/llm/fallback.js';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';
import { batchTargetSchema, chunkPairs, parseGroupPayload } from './batch-tasks.js';
import { getBatchTask } from './batch-tasks.js';
import { loadBatchSources } from './batch-sources.js';
import { maxTokensForGroupSize } from './mistral-batch.js';
import { requireAdmin } from './require-admin.js';

/**
 * `ingredients.batch-run-inline` — admin-only quick inference (M4).
 *
 * Synchronous counterpart to the cheap async Mistral batch: packs up to 100
 * ingredient × language pairs into groups of `batchSize` and runs them
 * through the normal LLM failover chain, returning per-item salvaged rows
 * for UI review. Nothing is written — persisting is `batch-apply`'s job.
 * Use for spot-checks, prompt iteration, and tests; use `batch-submit` for
 * the full 2000-pair runs (50% cheaper via Mistral Batch API).
 */

const INLINE_MAX_PAIRS = 100;

export const batchRunInlineInput = batchTargetSchema.extend({
	ingredientIds: z.array(z.string().uuid()).min(1).max(100)
});

export type BatchRunInlineInput = z.infer<typeof batchRunInlineInput>;

export interface BatchRunInlineRow {
	ingredientId: string;
	lang: string;
	data: Record<string, unknown>;
	error: string | null;
	provider: string | null;
}

export interface BatchRunInlineResult {
	taskId: string;
	results: BatchRunInlineRow[];
	skipped: string[];
}

const groupEnvelopeSchema = z.object({
	results: z.array(z.record(z.string(), z.unknown()))
});

export const batchRunInlineOp = defineOp({
	name: 'ingredients.batch-run-inline',
	domain: 'ingredients',
	kind: 'write',
	sync: 'server-only',
	docs: {
		title: 'Run a small ingredient batch inline (admin)',
		description:
			'Admin-only: runs up to 100 ingredient × language pairs synchronously (packed batchSize per call) for review. Nothing is written; apply via ingredients.batch-apply.'
	},
	input: batchRunInlineInput,
	internal: true,
	handler: async (ctx: OpCtx, input: BatchRunInlineInput): Promise<BatchRunInlineResult> => {
		const admin = await requireAdmin(ctx);
		if (input.ingredientIds.length * input.targetLangs.length > INLINE_MAX_PAIRS) {
			throw new OpError(
				'VALIDATION',
				`Inline run too large: over ${INLINE_MAX_PAIRS} pairs — use ingredients.batch-submit instead.`
			);
		}
		const task = getBatchTask(input.taskId);
		const { sources, skipped } = await loadBatchSources(admin, input.ingredientIds);
		const groups = chunkPairs(sources, input.targetLangs, input.batchSize);

		const traceId = crypto.randomUUID();
		const results: BatchRunInlineResult['results'] = [];

		// Sequential: keeps provider rate limits happy and errors attributable.
		for (const group of groups) {
			const userMessage = task.buildGroupUserMessage(
				group.pairs.map((p, i) => ({ ref: i, source: p.source })),
				group.lang
			);
			try {
				const { value, provider } = await withLlmFailover(
					(p) =>
						generateText({
							model: p.model,
							output: Output.object({ schema: groupEnvelopeSchema }),
							maxOutputTokens: maxTokensForGroupSize(group.pairs.length),
							messages: [
								{ role: 'system', content: task.systemPrompt },
								{ role: 'user', content: userMessage }
							],
							temperature: 0
						}),
					{ traceId, sessionId: traceId, distinctId: ctx.userId }
				);
				for (const row of parseGroupPayload(value.output, task, group)) {
					results.push({ ...row, provider });
				}
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				for (const p of group.pairs) {
					results.push({
						ingredientId: p.ingredientId,
						lang: p.lang,
						data: {},
						error: message.slice(0, 500),
						provider: null
					});
				}
			}
		}
		if (results.length === 0 && skipped.length > 0) {
			throw new OpError('VALIDATION', 'No ingredient had source text to translate.');
		}
		return { taskId: input.taskId, results, skipped };
	}
});
