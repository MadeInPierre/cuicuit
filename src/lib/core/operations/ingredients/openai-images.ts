import { env } from '$env/dynamic/private';

import { OpError } from '../errors.js';

/**
 * Minimal OpenAI image client (M5, server-only).
 *
 * Raw `fetch` — no new dependency. Single generation only this round, but
 * shaped for the future batch system: `buildImageRequestBody` is exported so
 * a later `ingredients.image-batch-submit` can pack many
 * `{ custom_id, method, url, body }` lines for the OpenAI Batch API
 * (`POST /v1/batches` with `endpoint: '/v1/images/generations'`) and reuse
 * `parseImageResponse` on each result line.
 *
 * Missing key → `INTERNAL` with a clear message; the rest of the dashboard
 * keeps working (same graceful-degradation pattern as `providers.ts`).
 */

export const IMAGE_MODEL_DEFAULT = 'gpt-image-1';
export const IMAGE_SIZE_DEFAULT = '1024x1024';

export interface ImageRequestBody {
	model: string;
	prompt: string;
	n: number;
	size: string;
	output_format: 'png';
	background: 'transparent';
}

/** One `/v1/images/generations` body — also one line of a future batch file. */
export function buildImageRequestBody(prompt: string, model: string): ImageRequestBody {
	return {
		model,
		prompt,
		n: 1,
		size: IMAGE_SIZE_DEFAULT,
		output_format: 'png',
		background: 'transparent'
	};
}

function apiKey(): string {
	// Shared key by design (user choice): `OPENAI_API_KEY` first so a single
	// key covers future text + image batching; `OPENAI_IMAGE_API_KEY` stays
	// as an escape hatch for split billing.
	const key = env.OPENAI_API_KEY || env.OPENAI_IMAGE_API_KEY;
	if (!key) {
		throw new OpError(
			'INTERNAL',
			'Image generation is unavailable: OPENAI_API_KEY is not set. ' +
				'Add it to the environment to enable AI images; manual upload keeps working without it.'
		);
	}
	return key;
}

export function resolveImageModel(): string {
	return env.OPENAI_IMAGE_MODEL || IMAGE_MODEL_DEFAULT;
}

export interface GeneratedImage {
	bytes: Uint8Array;
	model: string;
}

/** Extracts the PNG bytes from an images API response payload. */
export function parseImageResponse(payload: unknown, model: string): GeneratedImage {
	const b64 = (payload as { data?: Array<{ b64_json?: string }> })?.data?.[0]?.b64_json;
	if (!b64 || typeof b64 !== 'string') {
		throw new OpError('INTERNAL', 'Image generation returned no image data.');
	}
	// `atob`, not `Buffer`: this module must stay runnable without node types.
	const binary = atob(b64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return { bytes, model };
}

/** Generates one image — the unit of work a future batch fan-out will reuse. */
export async function generateSingleImage(prompt: string, model: string): Promise<GeneratedImage> {
	const res = await fetch('https://api.openai.com/v1/images/generations', {
		method: 'POST',
		headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json' },
		body: JSON.stringify(buildImageRequestBody(prompt, model))
	});
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new OpError(
			'INTERNAL',
			`Image generation failed (${res.status}): ${text.slice(0, 300)}.`
		);
	}
	return parseImageResponse((await res.json()) as unknown, model);
}
