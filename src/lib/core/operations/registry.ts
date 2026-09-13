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

export interface OpDef<TIn, TOut> {
	/** Unique name, e.g. `plans.add-recipe` — used by API/MCP/sync adapters. */
	name: string;
	domain: string;
	kind: OpKind;
	sync: OpSync;
	/** Set ONLY on `recipes.import-from-url` / `recipes.import-from-text`. */
	credits?: { feature: string; seeds: number };
	input: z.ZodType<TIn>;
	handler: (ctx: OpCtx, input: TIn) => Promise<TOut> | AsyncGenerator<unknown, TOut>;
	/** True → core-only (scrape, enrich, `billing.consume`): hidden from API/MCP. */
	internal?: boolean;
}

export const registry = new Map<string, OpDef<unknown, unknown>>();

/**
 * Define and register an operation. Throws on duplicate names — op names are
 * the contract between core and every adapter, so collisions fail fast.
 */
export function defineOp<TIn, TOut>(def: OpDef<TIn, TOut>): OpDef<TIn, TOut> {
	if (registry.has(def.name)) {
		throw new OpError('INTERNAL', `Duplicate operation name: ${def.name}`);
	}
	registry.set(def.name, def as OpDef<unknown, unknown>);
	return def;
}

/**
 * Run an op by name: validates input against the op's zod schema, then calls the handler.
 *
 * M1 note: async-generator (streaming) handlers are NOT supported by `runOp` yet —
 * M2 adds a streaming runner for the import ops. Streaming defs fail fast here.
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
