import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';
import {
	batchTaskIdSchema,
	decodeCustomId,
	type BatchResultRow
} from './batch-tasks.js';
import { getBatchTask } from './batch-tasks.js';
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
 * Input is just `{ jobId, taskId }` (both persisted by the UI in
 * localStorage). While the job runs, returns `{ status, done: false }`.
 * On `SUCCESS`, downloads the output file, validates each line against the
 * task's output schema, and returns review-ready rows. Nothing is written —
 * persisting is `batch-apply`'s job, after human review.
 */

export const batchStatusInput = z.object({
	jobId: z.string().min(1).max(100),
	taskId: batchTaskIdSchema
});

export type BatchStatusInput = z.infer<typeof batchStatusInput>;

export interface BatchReviewRow extends BatchResultRow {
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
		await requireAdmin(ctx);
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
			return { ...base, done: false as const, results: [] as BatchReviewRow[] };
		}
		if (!job.output_file) {
			throw new OpError('INTERNAL', 'Batch job succeeded but has no output file.');
		}

		const jsonl = await downloadBatchFile(job.output_file);
		const lines = parseOutputLines(jsonl);
		const results: BatchReviewRow[] = [];
		for (const line of lines) {
			const decoded = decodeCustomId(line.custom_id);
			if (!decoded) continue;
			const extracted = extractLineContent(line);
			if ('error' in extracted) {
				results.push({
					ingredientId: decoded.ingredientId,
					lang: decoded.lang,
					data: {},
					error: extracted.error
				});
				continue;
			}
			const parsed = task.outputSchema.safeParse(extracted.json);
			if (!parsed.success) {
				results.push({
					ingredientId: decoded.ingredientId,
					lang: decoded.lang,
					data: {},
					error: 'Model output failed validation.'
				});
				continue;
			}
			results.push({
				ingredientId: decoded.ingredientId,
				lang: decoded.lang,
				data: parsed.data as Record<string, unknown>,
				error: null
			});
		}
		return { ...base, done: true as const, results };
	}
});
