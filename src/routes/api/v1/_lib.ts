import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { ZodError } from 'zod';

import { requireApiCtx, type ApiAuthMethod } from '$lib/core/operations/context.js';
import { OpError, toStatus } from '$lib/core/operations/errors.js';
// Side-effect: registers every op so routes can `runOp` by name.
import '$lib/core/operations/index.js';
import { runOp, runOpStream, type OpCtx } from '$lib/core/operations/registry.js';

/**
 * Shared thin-adapter helpers for `src/routes/api/v1`.
 *
 * Every route is: auth → assemble input (path params + query/body, with
 * `ctx.userId` forced over any client-supplied identity) → `runOp`/`runOpStream`
 * → JSON or SSE. No business logic lives here or in any `+server.ts`.
 */

export interface ApiAuth {
	ctx: OpCtx;
	authMethod: ApiAuthMethod;
	/** Revokes the minted PAT session — runs after the request (no-op for JWT). */
	cleanup: () => void;
}

/** Authenticate `Authorization: Bearer <supabaseJWT|cui_...>` → ctx + method. */
export async function requireApi(event: RequestEvent): Promise<ApiAuth> {
	return requireApiCtx(event);
}

/** Token-management routes are JWT-only: PATs must not mint/revoke PATs. */
export function requireJwt(auth: ApiAuth): void {
	if (auth.authMethod === 'pat') {
		throw new OpError('FORBIDDEN', 'This endpoint requires a user JWT, not an API token.');
	}
}

/** Parse a JSON body; `{}` when the request has no body (DELETE-with-query etc.). */
export async function readJson(event: RequestEvent): Promise<Record<string, unknown>> {
	const text = await event.request.text();
	if (!text) return {};
	try {
		const parsed: unknown = JSON.parse(text);
		if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
			throw new OpError('VALIDATION', 'Request body must be a JSON object.');
		}
		return parsed as Record<string, unknown>;
	} catch (error) {
		if (error instanceof OpError) throw error;
		throw new OpError('VALIDATION', 'Request body is not valid JSON.');
	}
}

/** Read a query param, optionally required. */
export function queryParam(event: RequestEvent, name: string, opts?: { required?: boolean }) {
	const value = event.url.searchParams.get(name);
	if ((value === null || value === '') && opts?.required) {
		throw new OpError('VALIDATION', `Missing required query parameter: ${name}.`);
	}
	return value;
}

/** Map any thrown value to a JSON error response (`OpError.code` → status). */
export function toResponse(error: unknown): Response {
	if (error instanceof OpError) {
		return json(
			{ error: { code: error.code, message: error.message } },
			{ status: toStatus(error.code) }
		);
	}
	if (error instanceof ZodError) {
		return json(
			{ error: { code: 'VALIDATION', message: 'Invalid input.', details: error.issues } },
			{ status: 400 }
		);
	}
	console.error('[api] unhandled error', error);
	return json(
		{ error: { code: 'INTERNAL', message: 'Unexpected server error.' } },
		{ status: 500 }
	);
}

/**
 * Run an op and return its output as JSON. `runOp` validates `input` against
 * the op's zod schema — `ZodError` becomes 400 via `toResponse`. The minted
 * PAT session (if any) is revoked once the op has run.
 */
export async function runApiOp(name: string, auth: ApiAuth, input: unknown): Promise<Response> {
	try {
		return json(await runOp(name, auth.ctx, input));
	} catch (error) {
		return toResponse(error);
	} finally {
		auth.cleanup();
	}
}

/**
 * Stream a generator op as `text/event-stream`: every yield becomes
 * `data: <json>`, then the stream ends. A mid-stream `OpError` becomes an
 * `event: error` frame (status is already 200 — CLI clients must watch for it).
 * The minted PAT session (if any) is revoked when the stream ends or the
 * consumer disconnects.
 */
export function streamApiOp(name: string, auth: ApiAuth, input: unknown): Response {
	const { ctx } = auth;
	const encoder = new TextEncoder();
	const stream = new ReadableStream({
		async start(controller) {
			const send = (event: string | null, payload: unknown) => {
				const frame = `${event ? `event: ${event}\n` : ''}data: ${JSON.stringify(payload)}\n\n`;
				controller.enqueue(encoder.encode(frame));
			};
			try {
				for await (const value of runOpStream(name, ctx, input)) {
					if (ctx.signal?.aborted) break;
					send(null, value);
				}
			} catch (error) {
				if (error instanceof OpError) {
					send('error', { code: error.code, message: error.message });
				} else if (error instanceof ZodError) {
					send('error', { code: 'VALIDATION', message: 'Invalid input.' });
				} else {
					console.error('[api] unhandled stream error', error);
					send('error', { code: 'INTERNAL', message: 'Unexpected server error.' });
				}
			} finally {
				controller.close();
				auth.cleanup();
			}
		},
		cancel() {
			// Consumer disconnected — the op keeps `ctx.signal` for abort checks.
			auth.cleanup();
		}
	});
	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
}

/** Extract a single uploaded `File` plus the remaining text fields from multipart. */
export async function readUpload(
	event: RequestEvent,
	fileField: string
): Promise<{ file: File; fields: Record<string, string> }> {
	const form = await event.request.formData();
	const file = form.get(fileField);
	if (!(file instanceof File) || file.size === 0) {
		throw new OpError('VALIDATION', `Missing uploaded file field: ${fileField}.`);
	}
	const fields: Record<string, string> = {};
	for (const [key, value] of form.entries()) {
		if (typeof value === 'string') fields[key] = value;
	}
	return { file, fields };
}
