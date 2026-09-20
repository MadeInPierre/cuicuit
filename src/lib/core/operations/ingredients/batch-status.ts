import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';
import { batchTargetSchema, chunkPairs, decodeGroupId, parseGroupPayload } from './batch-tasks.js';
import { getBatchTask } from './batch-tasks.js';
import { loadBatchSources } from './batch-sources.js';
import {
	downloadBatchFile,
	extractLineContent,
	getBatchJob,
	parseOutputLines
} from './mistral-batch.js';
import { requireAdmin } from './require-admin.js';

/**
 * `ingredients.batch-status` — poll a Mistral batch job + parse results (M4).
 *
 * Input is the full job spec `{ jobId, taskId, ingredientIds, targetLangs,
 * batchSize }` (persisted by the UI in localStorage): chunking is
 * deterministic, so the groups are rebuilt exactly as `batch-submit` made
 * them — no server-side job table needed. While the job runs, returns
 * `{ status, done: false }`. On `SUCCESS`, downloads the output file and
 * returns per-item salvaged rows for review. Nothing is written —
 * persisting is `batch-apply`'s job, after human review.
 */

export const batchStatusInput = batchTargetSchema.extend({
	jobId: z.string().min(1).max(100),
	ingredientIds: z.array(z.string().uuid()).min(1).max(2000)
});

export type BatchStatusInput = z.infer<typeof batchStatusInput>;

export interface BatchReviewRow {
	ingredientId: string;
	lang: string;
	data: Record<string, unknown>;
	error: string | null;
}

export const batchStatusOp = defineOp({
	name: 'ingredients.batch-status',
	domain: 'ingredients',
	kind: 'read',
	sync: 'server-only',
	docs: {
		title: 'Poll a Mistral batch job (admin)',
		description:
			'Admin-only: polls a submitted batch job; on success returns validated rows for review. Nothing is written.'
	},
	input: batchStatusInput,
	internal: true,
	handler: async (ctx: OpCtx, input: BatchStatusInput) => {
		const admin = await requireAdmin(ctx);
		const task = getBatchTask(input.taskId);
		const job = await getBatchJob(input.jobId);

		const base = {
			jobId: job.id,
			status: job.status,
			totalRequests: job.total_requests ?? null,
			completedRequests: job.completed_requests ?? null,
			succeededRequests: job.succeeded_requests ?? null,
			failedRequests: job.failed_requests ?? null
		};

		if (job.status !== 'SUCCESS') {
			return { ...base, done: false as const, results: [] as BatchReviewRow[], skipped: [] as string[] };
		}
		if (!job.output_file) {
			throw new OpError('INTERNAL', 'Batch job succeeded but has no output file.');
		}

		// Rebuild the groups exactly as batch-submit made them.
		const { sources, skipped } = await loadBatchSources(admin, input.ingredientIds);
		const groups = new Map(chunkPairs(sources, input.targetLangs, input.batchSize).map((g) => [g.index, g]));

		const jsonl = await downloadBatchFile(job.output_file);
		const lines = parseOutputLines(jsonl);
		const results: BatchReviewRow[] = [];
		for (const line of lines) {
			const index = decodeGroupId(line.custom_id);
			const group = index === null ? undefined : groups.get(index);
			if (!group) continue;
			const extracted = extractLineContent(line);
			if ('error' in extracted) {
				for (const p of group.pairs) {
					results.push({ ingredientId: p.ingredientId, lang: p.lang, data: {}, error: extracted.error });
				}
				continue;
			}
			results.push(...parseGroupPayload(extracted.json, task, group));
		}
		return { ...base, done: true as const, results, skipped };
	}
});
