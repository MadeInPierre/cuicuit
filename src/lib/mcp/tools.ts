import { ZodError } from 'zod';

import { OpError } from '$lib/core/operations/errors.js';
import { opInputJsonSchema } from '$lib/core/operations/json-schema.js';
import { registry } from '$lib/core/operations/registry.js';

/**
 * MCP tool derivation — the single bridge between the op registry and the
 * `/mcp` route. Every public op (`!internal`, `docs.mcp !== false`) becomes
 * exactly one tool; names/descriptions/schemas/annotations all render from
 * `OpDef` + `OpDocs`, so adding metadata to `defineOp` is the only step
 * needed to expose a new op to agents.
 */

export interface McpToolAnnotations {
	readOnlyHint: boolean;
	destructiveHint: boolean;
	openWorldHint: boolean;
}

export interface McpToolDef {
	/** Registry op name, e.g. `plans.add-item`. */
	op: string;
	/** MCP tool name, e.g. `shopping_add`. */
	name: string;
	description: string;
	inputSchema: Record<string, unknown>;
	annotations: McpToolAnnotations;
}

/**
 * Identity fields are forced from the credential (`ctx.userId`) at call time —
 * agents must never supply them, so they are stripped from the exposed schema
 * and injected by `prepareMcpInput` before `runOp` validates.
 */
const IDENTITY_FIELDS = ['createdBy', 'userId'] as const;

/**
 * Default tool name: op name with `.` and `-` → `_` (dots are illegal in MCP
 * tool names; snake_case everywhere for consistency).
 */
export function defaultToolName(opName: string): string {
	return opName.replace(/[.-]/g, '_');
}

function isObjectSchema(schema: unknown): schema is {
	properties?: Record<string, unknown>;
	required?: unknown;
} {
	return typeof schema === 'object' && schema !== null && !Array.isArray(schema);
}

/** Identity fields the op's schema declares (hence injectable at call time). */
function injectableIdentityFields(opName: string): string[] {
	const schema = opInputJsonSchema(opName);
	if (!isObjectSchema(schema)) return [];
	const properties = schema.properties;
	if (!isRecord(properties)) return [];
	return IDENTITY_FIELDS.filter((f) => f in properties);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stripIdentityFields(
	schema: Record<string, unknown>,
	fields: string[]
): Record<string, unknown> {
	if (fields.length === 0 || !isObjectSchema(schema) || !isRecord(schema.properties)) {
		return schema;
	}
	const properties = { ...schema.properties };
	for (const f of fields) delete properties[f];
	const required = Array.isArray(schema.required)
		? schema.required.filter((r) => typeof r !== 'string' || !fields.includes(r))
		: schema.required;
	return { ...schema, properties, required };
}

/** Build the full tool list from the registry (deterministic, sorted by name). */
export function buildMcpTools(): McpToolDef[] {
	const tools: McpToolDef[] = [];
	for (const def of registry.values()) {
		if (def.internal || def.docs.mcp === false) continue;
		const fields = injectableIdentityFields(def.name);
		const parts = [def.docs.description, ...(def.docs.hints ?? [])];
		if (def.credits) {
			const plural = def.credits.seeds === 1 ? '' : 's';
			parts.push(
				`Costs ${def.credits.seeds} seed${plural} per successful run ('${def.credits.feature}'). ` +
					'Charged only after success — insufficient seeds fail without side effects.'
			);
		}
		tools.push({
			op: def.name,
			name: def.docs.tool ?? defaultToolName(def.name),
			description: parts.join('\n\n'),
			inputSchema: stripIdentityFields(opInputJsonSchema(def.name), fields),
			annotations: {
				readOnlyHint: def.docs.annotations?.readOnly ?? def.kind === 'read',
				destructiveHint: def.docs.annotations?.destructive ?? def.kind === 'write',
				openWorldHint: def.docs.annotations?.openWorld ?? false
			}
		});
	}
	return tools.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

/**
 * Merge raw tool arguments with the credential identity: injects `createdBy` /
 * `userId` from `ctx.userId` for ops that declare them (overwriting anything
 * the agent sent), so `runOp` validation sees the complete input.
 */
export function prepareMcpInput(opName: string, userId: string, args: unknown): unknown {
	if (!isRecord(args)) return args;
	const fields = injectableIdentityFields(opName);
	if (fields.length === 0) return args;
	return { ...args, ...Object.fromEntries(fields.map((f) => [f, userId])) };
}

function safeDetails(details: unknown): string {
	try {
		return JSON.stringify(details) ?? '';
	} catch {
		return '';
	}
}

/**
 * Verbose technical fields that bloat tool outputs for agents (repeated
 * author objects, embeddings, search vectors) without ever informing an
 * action. Stripped recursively from successful MCP results only — the app
 * and REST paths are untouched.
 */
const MCP_STRIP_KEYS = new Set([
	'author_profile',
	'embedding',
	'hierarchy',
	'unit_frequencies',
	'fts',
	'tsvector',
	'search_vector'
]);

/** Recursively drop `MCP_STRIP_KEYS` from a JSON-serializable value. */
export function compactMcpOutput<T>(value: T): T {
	if (Array.isArray(value)) return value.map(compactMcpOutput) as T;
	if (isRecord(value)) {
		const out: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(value)) {
			if (MCP_STRIP_KEYS.has(k)) continue;
			out[k] = compactMcpOutput(v);
		}
		return out as T;
	}
	return value;
}

/**
 * Render a tool-call failure as MCP text. RLS/permission rejections surface
 * from PostgREST as generic errors — detect them and say what they usually
 * mean (wrong id, or an object owned by someone else) instead of looking like
 * a server bug.
 */
export function mcpErrorText(error: unknown): string {
	if (error instanceof OpError) {
		const haystack = `${error.message} ${safeDetails(error.details)}`;
		if (
			error.code === 'INTERNAL' &&
			/row-level security|RLS|permission denied|not allowed|unauthorized/i.test(haystack)
		) {
			return (
				`FORBIDDEN: ${error.message} ` +
				'(This is usually a permission rejection — e.g. a wrong spaceId or an object owned by someone else — not a server bug. Re-check spaces_list and the ids before retrying.)'
			);
		}
		return `${error.code}: ${error.message}`;
	}
	if (error instanceof ZodError) {
		return `VALIDATION: Invalid input: ${JSON.stringify(error.issues)}`;
	}
	console.error('[mcp] unhandled tool error', error);
	return 'INTERNAL: Unexpected server error.';
}
