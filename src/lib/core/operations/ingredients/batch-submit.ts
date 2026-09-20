import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';
import { batchTargetSchema, encodeCustomId, getBatchTask } from './batch-tasks.js';
import { loadBatchSources } from './batch-sources.js';
import {
	BATCH_MODEL_DEFAULT,
	buildChatBody,
	MAX_BATCH_REQUESTS,
	submitBatch,
	type BatchRequestLine
} from './mistral-batch.js';
import { requireAdmin } from './require-admin.js';

/**
 * `ingredients.batch-submit` — admin-only cheap async batch (M4).
 *
 * Builds one Mistral Batch request per ingredient × language (up to 2000
 * total) and submits it to the Mistral Batch API (~50% cheaper than sync).
 * Returns the Mistral `jobId` — poll with `ingredients.batch-status`, then
 * persist reviewed rows with `ingredients.batch-apply`. Nothing is written
 * to the catalog by this op.
 *
 * Stateless by design (no new table): the UI persists `{ jobId, taskId }`
 * in localStorage; the job payload lives on Mistral's side. A DB-backed job
 * table can be added later without changing this op's contract.
 */

export const batchSubmitInput = batchTargetSchema.extend({
	ingredientIds: z.array(z.string().uuid()).min(1).max(2000),
	model: z.string().min(1).max(100).default(BATCH_MODEL_DEFAULT)
});

export type BatchSubmitInput = z.infer<typeof batchSubmitInput>;

export const batchSubmitOp = defineOp({
	name: 'ingredients.batch-submit',
	domain: 'ingredients',
	kind: 'write',
	sync: 'server-only',
	docs: {
		title: 'Submit a cheap Mistral batch job (admin)',
		description:
			'Admin-only: submits up to 2000 ingredient × language inferences to the Mistral Batch API. Poll with ingredients.batch-status, apply with ingredients.batch-apply.'
	},
	input: batchSubmitInput,
	internal: true,
	handler: async (ctx: OpCtx, input: BatchSubmitInput) => {
		const admin = await requireAdmin(ctx);
		const total = input.ingredientIds.length * input.targetLangs.length;
		if (total > MAX_BATCH_REQUESTS) {
			throw new OpError(
				'VALIDATION',
				`Batch too large: ${total} requests (ingredients × languages) > ${MAX_BATCH_REQUESTS}. Split it up.`
			);
		}
		const task = getBatchTask(input.taskId);
		const { sources, skipped } = await loadBatchSources(admin, input.ingredientIds);
		if (sources.length === 0) {
			throw new OpError('VALIDATION', 'No ingredient had source text to translate.');
		}

		const requests: BatchRequestLine[] = [];
		for (const source of sources) {
			for (const lang of input.targetLangs) {
				requests.push({
					custom_id: encodeCustomId(source.ingredientId, lang),
					body: buildChatBody(task.systemPrompt, task.buildUserMessage(source, lang), input.model)
				});
			}
		}

		const { job, via } = await submitBatch(requests, input.model);
		return {
			jobId: job.id,
			status: job.status,
			via,
			model: input.model,
			taskId: input.taskId,
			requestCount: requests.length,
			skipped
		};
	}
});
