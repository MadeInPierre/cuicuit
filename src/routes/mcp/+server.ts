import { json, type RequestEvent } from '@sveltejs/kit';

import { requireApiCtx } from '$lib/core/operations/context.js';
import { OpError } from '$lib/core/operations/errors.js';
// Side-effect: registers every op so tools resolve by name.
import '$lib/core/operations/index.js';
import { runOpStream } from '$lib/core/operations/registry.js';
import { buildMcpTools, compactMcpOutput, mcpErrorText, prepareMcpInput } from '$lib/mcp/tools.js';

/**
 * MCP endpoint (Streamable HTTP, stateless — no session ids, no SSE GET).
 *
 * Manual JSON-RPC framing (no SDK dependency): `POST` handles `initialize`,
 * `tools/list` (pre-auth, schema only) and `tools/call` (requires
 * `Authorization: Bearer <supabaseJWT|cui_...>`); every other method is a
 * JSON-RPC error. Tool handlers are thin: auth → inject identity →
 * `runOpStream` to completion → MCP result. Op errors become `isError`
 * results (never partial writes — core charges only after success).
 */

const SERVER_INFO = { name: 'cuicuit', version: '1.0.0' };
const PROTOCOL_VERSION_FALLBACK = '2025-06-18';

type RpcId = string | number | null;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function rpcResult(id: RpcId, result: unknown): Response {
	return json({ jsonrpc: '2.0', id, result });
}

function rpcError(id: RpcId, code: number, message: string, status = 200): Response {
	return json({ jsonrpc: '2.0', id, error: { code, message } }, { status });
}

/** No SSE-stream GET in v1 — plain POST only. */
export function GET(): Response {
	return json(
		{ error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST with a JSON-RPC body.' } },
		{ status: 405, headers: { Allow: 'POST' } }
	);
}

export async function POST(event: RequestEvent): Promise<Response> {
	let body: unknown;
	try {
		body = await event.request.json();
	} catch {
		return rpcError(null, -32700, 'Parse error: body must be JSON.', 400);
	}
	if (!isRecord(body) || body.jsonrpc !== '2.0' || typeof body.method !== 'string') {
		const id = (isRecord(body) && (body.id as RpcId)) || null;
		return rpcError(
			id,
			-32600,
			'Invalid Request: expected JSON-RPC 2.0 { jsonrpc: "2.0", id, method, params }.',
			400
		);
	}
	const id = (body.id ?? null) as RpcId;
	const method = body.method;
	const params = isRecord(body.params) ? body.params : {};

	// Notifications (no id) need no response.
	if (body.id === undefined) return new Response(null, { status: 202 });

	switch (method) {
		case 'initialize': {
			const protocolVersion =
				typeof params.protocolVersion === 'string'
					? params.protocolVersion
					: PROTOCOL_VERSION_FALLBACK;
			return rpcResult(id, {
				protocolVersion,
				capabilities: { tools: {} },
				serverInfo: SERVER_INFO
			});
		}
		case 'tools/list': {
			return rpcResult(id, { tools: buildMcpTools() });
		}
		case 'tools/call': {
			const tool =
				typeof params.name === 'string'
					? buildMcpTools().find((t) => t.name === params.name)
					: undefined;
			if (!tool) {
				return rpcError(
					id,
					-32602,
					`Unknown tool: ${typeof params.name === 'string' ? params.name : '(missing name)'}. Call tools/list first.`
				);
			}
			let ctx;
			try {
				ctx = (await requireApiCtx(event, 'mcp')).ctx;
			} catch (error) {
				if (error instanceof OpError && error.code === 'UNAUTHENTICATED') {
					// Log tool + message (never the credential).
					console.warn(`[mcp] auth failed for tool '${tool.name}': ${error.message}`);
					return rpcError(id, -32000, `Unauthorized: ${error.message}`, 401);
				}
				console.error('[mcp] auth error', error);
				return rpcError(id, -32603, 'Internal error during authentication.');
			}
			try {
				let input = prepareMcpInput(
					tool.op,
					ctx.userId,
					params.arguments === undefined ? {} : params.arguments
				);
				// billing.checkout needs `origin` (the REST adapter injects it from the
				// request URL) — same default here so the tool is actually callable.
				if (tool.op === 'billing.checkout' && isRecord(input) && typeof input.origin !== 'string') {
					input = { ...input, origin: event.url.origin };
				}
				let output: unknown;
				for await (const value of runOpStream(tool.op, ctx, input)) output = value;
				return rpcResult(id, {
					content: [{ type: 'text', text: JSON.stringify(compactMcpOutput(output)) }]
				});
			} catch (error) {
				return rpcResult(id, {
					content: [{ type: 'text', text: mcpErrorText(error) }],
					isError: true
				});
			}
		}
		default:
			return rpcError(id, -32601, `Method not found: ${method}.`);
	}
}
