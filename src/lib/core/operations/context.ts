import { getRequestEvent } from '$app/server';

import { requireUserId } from './auth.js';
import { OpError } from './errors.js';
import type { OpCtx, OpSource } from './registry.js';

/**
 * Build an `OpCtx` for the given source.
 *
 * SERVER-ONLY module: imports `$app/server`. Never import from client components —
 * only `*.remote.ts` / `+server.ts` / future API-MCP-sync adapters.
 *
 * M1 implements `'app'` only (from `getRequestEvent().locals`, as today's remotes do).
 * `'api' | 'mcp' | 'sync'` throw until M3/M4/M5 wire JWT/PAT/sync auth.
 */
export async function requireCtx(
	source: OpSource,
	opts?: { signal?: AbortSignal }
): Promise<OpCtx> {
	if (source !== 'app') {
		throw new OpError(
			'INTERNAL',
			`TODO(auth-tokens): OpCtx for source '${source}' not implemented yet.`
		);
	}
	const event = getRequestEvent();
	const userId = await requireUserId(event.locals.supabase);
	return {
		supabase: event.locals.supabase,
		admin: event.locals.supabaseAdmin,
		userId,
		source,
		signal: opts?.signal
	};
}
