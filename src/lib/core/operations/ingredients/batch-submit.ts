import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';
import { batchTargetSchema, chunkPairs, encodeGroupId, getBatchTask } from './batch-tasks.js';
import { loadBatchSources } from './batch-sources.js';
import {
	BATCH_MODEL_DEFAULT,
	buildChatBody,
	MAX_BATCH_REQUESTS,
	maxTokensForGroupSize,
	submitBatch,
	type BatchRequestLine
} from './mistral-batch.js';
import { requireAdmin } from './require-admin.js';

/**
 * `ingredients.batch-submit` — admin-only cheap async batch (M4).
 *
 * Packs up to 2000 ingredient × language pairs into groups of `batchSize`
 * (default 10, same language per request) and submits them to the Mistral
 * Batch API (~50% cheaper than sync, plus the shared system prompt is
 * amortized across the group). Returns the Mistral `jobId` — poll with
 * `ingredients.batch-status` (passing the same ids/langs/size so it can
 * rebuild the groups statelessly), then persist reviewed rows with
 * `ingredients.batch-apply`. Nothing is written to the catalog by this op.
 *
 * Stateless by design (no new table): the UI persists
 * `{ jobId, taskId, ingredientIds, targetLangs, batchSize }` in
 * localStorage; the job payload lives on Mistral's side.
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
			'Admin-only: submits up to 2000 ingredient × language pairs (packed batchSize per request) to the Mistral Batch API. Poll with ingredients.batch-status, apply with ingredients.batch-apply.'
	},
	input: batchSubmitInput,
	internal: true,
	handler: async (ctx: OpCtx, input: BatchSubmitInput) => {
		const admin = await requireAdmin(ctx);
		const pairCount = input.ingredientIds.length * input.targetLangs.length;
		if (pairCount > MAX_BATCH_REQUESTS) {
			throw new OpError(
				'VALIDATION',
				`Batch too large: ${pairCount} pairs (ingredients × languages) > ${MAX_BATCH_REQUESTS}. Split it up.`
			);
		}
		const task = getBatchTask(input.taskId);
		const { sources, skipped } = await loadBatchSources(admin, input.ingredientIds);
		if (sources.length === 0) {
			throw new OpError('VALIDATION', 'No ingredient had source text to translate.');
		}

		const groups = chunkPairs(sources, input.targetLangs, input.batchSize);
		const requests: BatchRequestLine[] = groups.map((group) => ({
			custom_id: encodeGroupId(group.index),
			body: buildChatBody(
				task.systemPrompt,
				task.buildGroupUserMessage(
					group.pairs.map((p, i) => ({ ref: i, source: p.source })),
					group.lang
				),
				input.model,
				maxTokensForGroupSize(group.pairs.length)
			)
		}));

		const { job, via } = await submitBatch(requests, input.model);
		return {
			jobId: job.id,
			status: job.status,
			via,
			model: input.model,
			taskId: input.taskId,
			batchSize: input.batchSize,
			pairCount,
			requestCount: requests.length,
			skipped
		};
	}
});
