import { z } from 'zod';

import { generateText, Output } from 'ai';

import { withLlmFailover } from '$lib/shared/llm/fallback.js';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';
import { batchTargetSchema, getBatchTask } from './batch-tasks.js';
import { loadBatchSources } from './batch-sources.js';
import { requireAdmin } from './require-admin.js';

/**
 * `ingredients.batch-run-inline` — admin-only quick inference (M4).
 *
 * Synchronous counterpart to the cheap async Mistral batch: runs up to 50
 * requests through the normal LLM failover chain and returns validated rows
 * for UI review. Nothing is written — persisting is `batch-apply`'s job.
 * Use for spot-checks, prompt iteration, and tests; use `batch-submit` for
 * the full 2000-ingredient runs (50% cheaper via Mistral Batch API).
 */

export const batchRunInlineInput = batchTargetSchema.extend({
	ingredientIds: z.array(z.string().uuid()).min(1).max(50)
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

export const batchRunInlineOp = defineOp({
	name: 'ingredients.batch-run-inline',
	domain: 'ingredients',
	kind: 'write',
	sync: 'server-only',
	docs: {
		title: 'Run a small ingredient batch inline (admin)',
		description:
			'Admin-only: runs up to 50 ingredient × language inferences synchronously for review. Nothing is written; apply via ingredients.batch-apply.'
	},
	input: batchRunInlineInput,
	internal: true,
	handler: async (ctx: OpCtx, input: BatchRunInlineInput): Promise<BatchRunInlineResult> => {
		const admin = await requireAdmin(ctx);
		const task = getBatchTask(input.taskId);
		const { sources, skipped } = await loadBatchSources(admin, input.ingredientIds);

		const traceId = crypto.randomUUID();
		const results: BatchRunInlineResult['results'] = [];

		// Sequential: keeps provider rate limits happy and errors attributable.
		// 50 requests max, so worst-case latency stays tolerable for a UI spinner.
		for (const source of sources) {
			for (const lang of input.targetLangs) {
				const userMessage = task.buildUserMessage(source, lang);
				try {
					const { value, provider } = await withLlmFailover(
						(p) =>
							generateText({
								model: p.model,
								output: Output.object({ schema: task.outputSchema as never }),
								messages: [
									{ role: 'system', content: task.systemPrompt },
									{ role: 'user', content: userMessage }
								],
								temperature: 0
							}),
						{ traceId, sessionId: traceId, distinctId: ctx.userId }
					);
					const parsed = task.outputSchema.safeParse(value.output);
					if (!parsed.success) {
						results.push({
							ingredientId: source.ingredientId,
							lang,
							data: {},
							error: 'Model output failed validation.',
							provider
						});
						continue;
					}
					results.push({
						ingredientId: source.ingredientId,
						lang,
						data: parsed.data,
						error: null,
						provider
					});
				} catch (err) {
					const message = err instanceof Error ? err.message : String(err);
					results.push({
						ingredientId: source.ingredientId,
						lang,
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
