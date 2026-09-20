import { env } from '$env/dynamic/private';

import { OpError } from '../errors.js';

/**
 * Minimal Mistral Batch API client (M4, server-only).
 *
 * Docs: https://docs.mistral.ai/capabilities/batch — async inference at ~50%
 * of the sync price. Two submission paths:
 * - inline (`POST /v1/batch/jobs` with `requests[]`): < 10k requests, no file
 *   round-trip. Used for small batches.
 * - file (`POST /v1/files` + job with `input_files[]`): up to 1M requests.
 *   Used for large batches (2000 ingredients × langs).
 *
 * No new dependency: raw `fetch` against `https://api.mistral.ai`.
 * Missing key → `INTERNAL` with a clear message (dashboard stays usable).
 */

const BASE = 'https://api.mistral.ai';

export const BATCH_MODEL_DEFAULT = 'mistral-small-latest';
export const BATCH_ENDPOINT = '/v1/chat/completions';
/** Above this many requests, upload a JSONL file instead of inline. */
export const INLINE_REQUEST_LIMIT = 200;
export const MAX_BATCH_REQUESTS = 2000;

export interface BatchRequestLine {
	custom_id: string;
	body: Record<string, unknown>;
}

export type BatchJobStatus =
	| 'QUEUED'
	| 'RUNNING'
	| 'SUCCESS'
	| 'FAILED'
	| 'CANCELLED'
	| 'CANCELLATION_REQUESTED'
	| 'TIMEOUT_EXCEEDED'
	| string;

export interface BatchJob {
	id: string;
	model: string;
	endpoint: string;
	status: BatchJobStatus;
	input_files?: string[] | null;
	output_file?: string | null;
	error_file?: string | null;
	total_requests?: number | null;
	completed_requests?: number | null;
	succeeded_requests?: number | null;
	failed_requests?: number | null;
	created_at?: string | null;
}

function apiKey(): string {
	const key = env.MISTRAL_API_KEY;
	if (!key) {
		throw new OpError(
			'INTERNAL',
			'Mistral batch is unavailable: MISTRAL_API_KEY is not set. ' +
				'Add it to the environment to enable cheap batch inference; inline (sync) mode keeps working without it.'
		);
	}
	return key;
}

async function mistralFetch(path: string, init: RequestInit): Promise<unknown> {
	const res = await fetch(`${BASE}${path}`, {
		...init,
		headers: {
			Authorization: `Bearer ${apiKey()}`,
			...(init.headers as Record<string, string> | undefined)
		}
	});
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new OpError('INTERNAL', `Mistral batch API error (${res.status}): ${text.slice(0, 500)}.`);
	}
	return res.json() as Promise<unknown>;
}

/** Builds one `/v1/chat/completions` body for a translation request. */
export function buildChatBody(
	systemPrompt: string,
	userMessage: string,
	model: string
): Record<string, unknown> {
	return {
		model,
		messages: [
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: userMessage }
		],
		temperature: 0,
		max_tokens: 256,
		response_format: { type: 'json_object' }
	};
}

export function buildJsonl(requests: BatchRequestLine[]): string {
	return requests.map((r) => JSON.stringify(r)).join('\n') + '\n';
}

export async function submitInlineBatch(
	requests: BatchRequestLine[],
	model: string
): Promise<BatchJob> {
	if (requests.length > MAX_BATCH_REQUESTS) {
		throw new OpError('VALIDATION', `Batch too large: ${requests.length} > ${MAX_BATCH_REQUESTS}.`);
	}
	const job = (await mistralFetch('/v1/batch/jobs', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			model,
			endpoint: BATCH_ENDPOINT,
			requests,
			metadata: { job_type: 'cuicuit-ingredients' }
		})
	})) as BatchJob;
	return job;
}

export async function uploadBatchFile(jsonl: string, fileName = 'cuicuit-batch.jsonl'): Promise<string> {
	const form = new FormData();
	form.append('purpose', 'batch');
	form.append('file', new File([jsonl], fileName, { type: 'application/jsonl' }));
	const uploaded = (await mistralFetch('/v1/files', {
		method: 'POST',
		body: form
	})) as { id: string };
	if (!uploaded?.id) throw new OpError('INTERNAL', 'Mistral file upload returned no file id.');
	return uploaded.id;
}

export async function submitFileBatch(fileId: string, model: string): Promise<BatchJob> {
	const job = (await mistralFetch('/v1/batch/jobs', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			model,
			endpoint: BATCH_ENDPOINT,
			input_files: [fileId],
			metadata: { job_type: 'cuicuit-ingredients' }
		})
	})) as BatchJob;
	return job;
}

/** Submit via inline (<200 requests) or file upload — caller picks by size. */
export async function submitBatch(
	requests: BatchRequestLine[],
	model: string
): Promise<{ job: BatchJob; via: 'inline' | 'file' }> {
	if (requests.length <= INLINE_REQUEST_LIMIT) {
		return { job: await submitInlineBatch(requests, model), via: 'inline' };
	}
	const jsonl = buildJsonl(requests);
	const fileId = await uploadBatchFile(jsonl);
	return { job: await submitFileBatch(fileId, model), via: 'file' };
}

export async function getBatchJob(jobId: string): Promise<BatchJob> {
	return (await mistralFetch(`/v1/batch/jobs/${encodeURIComponent(jobId)}`, {
		method: 'GET'
	})) as BatchJob;
}

export async function cancelBatchJob(jobId: string): Promise<BatchJob> {
	return (await mistralFetch(`/v1/batch/jobs/${encodeURIComponent(jobId)}/cancel`, {
		method: 'POST'
	})) as BatchJob;
}

/** Downloads a Mistral output/error file (JSONL) as text. */
export async function downloadBatchFile(fileId: string): Promise<string> {
	const res = await fetch(`${BASE}/v1/files/${encodeURIComponent(fileId)}/content`, {
		headers: { Authorization: `Bearer ${apiKey()}` }
	});
	if (!res.ok) {
		throw new OpError('INTERNAL', `Failed to download batch output file (${res.status}).`);
	}
	return res.text();
}

/** One parsed line of a batch output file. */
export interface BatchOutputLine {
	custom_id: string;
	response?: {
		status_code?: number;
		body?: { choices?: Array<{ message?: { content?: string } }> };
	};
	error?: unknown;
}

export function parseOutputLines(jsonl: string): BatchOutputLine[] {
	const lines: BatchOutputLine[] = [];
	for (const raw of jsonl.split('\n')) {
		const line = raw.trim();
		if (!line) continue;
		try {
			lines.push(JSON.parse(line) as BatchOutputLine);
		} catch {
			// Skip malformed lines — reported as per-row errors downstream.
		}
	}
	return lines;
}

/** Extracts the assistant's JSON payload from one output line. */
export function extractLineContent(line: BatchOutputLine): { json: unknown } | { error: string } {
	if (line.error) return { error: `Request failed: ${JSON.stringify(line.error).slice(0, 300)}` };
	const content = line.response?.body?.choices?.[0]?.message?.content;
	if (!content || typeof content !== 'string') return { error: 'Empty model response.' };
	try {
		return { json: JSON.parse(content) };
	} catch {
		return { error: `Invalid JSON: ${content.slice(0, 200)}` };
	}
}
