import type { SupabaseClient } from '@supabase/supabase-js';
import type * as z from 'zod';

import type { Database } from '$lib/shared/db/supabase.types';

import { OpError, type OpErrorCode } from './errors.js';

export type { OpError, OpErrorCode };

export type OpSource = 'app' | 'api' | 'mcp' | 'sync';

export interface OpCtx {
	/** User-JWT client — RLS enforced. All normal reads/writes go through this. */
	supabase: SupabaseClient<Database>;
	/** Service-role client — server-only ops (`server-only` sync flag) use this. Never expose to UI. */
	admin?: SupabaseClient<Database>;
	userId: string;
	source: OpSource;
	signal?: AbortSignal;
}

export type OpKind = 'read' | 'write' | 'rpc' | 'storage';

/** `synced` = offline-capable (M5) · `server-only` = never synced · `later` = deferred past M5. */
export type OpSync = 'synced' | 'server-only' | 'later';

/** MCP tool-name annotations (spec hints). Plain data — no MCP/SDK types in core. */
export interface OpToolAnnotations {
	readOnly?: boolean;
	destructive?: boolean;
	openWorld?: boolean;
}

/**
 * Presentation metadata for an op — the single source rendered by every
 * surface: OpenAPI summaries, MCP tool names/descriptions/annotations, logs.
 * Adapters translate; core holds only transport-agnostic plain data.
 */
export interface OpDocs {
	/** Short label, e.g. 'Add a shopping item'. */
	title: string;
	/** 1–3 sentence agent-facing description (Markdown ok). */
	description: string;
	/**
	 * MCP tool name override, e.g. `plans.add-item` → `shopping_add`.
	 * Defaults to the op name with `.` → `_` (dots are illegal in MCP names).
	 */
	tool?: string;
	/** Extra agent notes appended to the tool description (flows, caveats). */
	hints?: string[];
	/** Set `false` to hide a public op from MCP (`auth.*` token ops: PATs must not mint PATs). */
	mcp?: false;
	annotations?: OpToolAnnotations;
}

export interface OpDef<TIn, TOut> {
	/** Unique name, e.g. `plans.add-recipe` — used by API/MCP/sync adapters. */
	name: string;
	domain: string;
	kind: OpKind;
	sync: OpSync;
	/** Set ONLY on `recipes.import-from-url` / `recipes.import-from-text`. */
	credits?: { feature: string; seeds: number };
	/** Presentation metadata (required): rendered by OpenAPI + MCP adapters. */
	docs: OpDocs;
	input: z.ZodType<TIn>;
	handler: (ctx: OpCtx, input: TIn) => Promise<TOut> | AsyncGenerator<unknown, TOut>;
	/** True → core-only (scrape, enrich, `billing.consume`): hidden from API/MCP. */
	internal?: boolean;
}

export const registry = new Map<string, OpDef<unknown, unknown>>();

/**
 * Define and register an operation.
 *
 * Re-registering an existing name OVERWRITES (with a server-log warning) instead
 * of throwing. Rationale: under `vite dev`, editing any op file
 * re-evaluates it (and the side-effect `index.ts`) against the surviving
 * `registry` singleton — the SSR module runner does not expose
 * `import.meta.hot`, so HMR cannot be detected and a strict throw poisoned
 * every adapter until a full server restart. Production evaluates each module
 * once, so an overwrite there means a genuine copy-paste name collision — loud
 * in the startup logs via the warning, without taking the server down.
 */
export function defineOp<TIn, TOut>(def: OpDef<TIn, TOut>): OpDef<TIn, TOut> {
	if (registry.has(def.name)) {
		console.warn(
			`[ops] Duplicate operation name '${def.name}' — overwriting previous registration.`
		);
	}
	registry.set(def.name, def as OpDef<unknown, unknown>);
	return def;
}

/**
 * Run an op by name: validates input against the op's zod schema, then calls the handler.
 */
export async function runOp<TIn, TOut>(name: string, ctx: OpCtx, input: TIn): Promise<TOut> {
	const def = registry.get(name) as OpDef<TIn, TOut> | undefined;
	if (!def) {
		throw new OpError('NOT_FOUND', `Unknown operation: ${name}`);
	}
	const parsed = def.input.parse(input) as TIn;
	const result: unknown = await def.handler(ctx, parsed);
	if (isAsyncIterable(result)) {
		throw new OpError(
			'INTERNAL',
			`Operation ${name} streams results — use the streaming runner (M2), not runOp.`
		);
	}
	return result as TOut;
}

/**
 * Streaming runner for ops whose handler is an async generator (the two import ops).
 * Validates input, then re-yields everything the handler yields (progress steps
 * followed by the final result object). Non-generator handlers yield once.
 *
 * M2 addition: `runOp` intentionally still rejects generators (fail-fast for
 * non-streaming adapters); streaming adapters (`query.live`, SSE, MCP) use this.
 */
export async function* runOpStream<TIn>(
	name: string,
	ctx: OpCtx,
	input: TIn
): AsyncGenerator<unknown, void, unknown> {
	const def = registry.get(name) as OpDef<TIn, unknown> | undefined;
	if (!def) {
		throw new OpError('NOT_FOUND', `Unknown operation: ${name}`);
	}
	const parsed = def.input.parse(input) as TIn;
	const result: unknown = await def.handler(ctx, parsed);
	if (isAsyncIterable(result)) {
		yield* result;
	} else {
		yield result;
	}
}

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
	return typeof value === 'object' && value !== null && Symbol.asyncIterator in value;
}
