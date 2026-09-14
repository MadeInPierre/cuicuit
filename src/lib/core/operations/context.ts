import { getRequestEvent } from '$app/server';
import { createClient } from '@supabase/supabase-js';
import type { RequestEvent } from '@sveltejs/kit';

import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';

import type { Database } from '$lib/shared/db/supabase.types';

import { requireUserId, resolvePatToken, signPatJwt } from './auth.js';
import { OpError } from './errors.js';
import type { OpCtx, OpSource } from './registry.js';
import { PAT_PREFIX } from './auth/pats.js';

export type ApiAuthMethod = 'jwt' | 'pat';

/**
 * Build an `OpCtx` for the given source.
 *
 * SERVER-ONLY module: imports `$app/server`. Never import from client components —
 * only `*.remote.ts` / `+server.ts` / future MCP-sync adapters.
 */
export async function requireCtx(
	source: OpSource,
	opts?: { signal?: AbortSignal; event?: RequestEvent }
): Promise<OpCtx> {
	if (source === 'api' || source === 'mcp') {
		return (await requireApiCtx(opts?.event ?? getRequestEvent(), source)).ctx;
	}
	if (source !== 'app') {
		throw new OpError(
			'INTERNAL',
			`TODO(auth-tokens): OpCtx for source '${source}' not implemented yet.`
		);
	}
	const event = opts?.event ?? getRequestEvent();
	const userId = await requireUserId(event.locals.supabase);
	return {
		supabase: event.locals.supabase,
		admin: event.locals.supabaseAdmin,
		userId,
		source,
		signal: opts?.signal
	};
}

/**
 * API/MCP auth: `Authorization: Bearer <supabaseJWT|cui_...>`.
 *
 * - Supabase JWT → forwarded to PostgREST (same RLS as the app).
 * - PAT → hash lookup via service-role, then a locally-signed short-lived
 *   JWT for the token owner, so RLS still applies per-request (the PAT
 *   itself never touches PostgREST). No GoTrue calls, nothing to clean up.
 *
 * Returns the ctx plus which credential type was used (token management
 * routes are JWT-only and reject `'pat'`).
 */
export async function requireApiCtx(
	event: RequestEvent,
	source: Extract<OpSource, 'api' | 'mcp'> = 'api'
): Promise<{ ctx: OpCtx; authMethod: ApiAuthMethod }> {
	const header = event.request.headers.get('authorization');
	const match = /^Bearer (.+)$/.exec(header?.trim() ?? '');
	if (!match) {
		throw new OpError(
			'UNAUTHENTICATED',
			'Missing Authorization header. Use: Authorization: Bearer <supabaseJWT|cui_...>.'
		);
	}
	const token = match[1];
	let authMethod: ApiAuthMethod;
	let jwt: string;
	if (token.startsWith(PAT_PREFIX)) {
		authMethod = 'pat';
		const userId = await resolvePatToken(token, event.locals.supabaseAdmin);
		jwt = await signPatJwt(userId);
	} else {
		authMethod = 'jwt';
		jwt = token;
	}
	// Short-lived, non-persisted client bound to the JWT: every PostgREST call
	// carries it, so RLS enforces the caller's identity on all data tables.
	const supabase = createClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
		auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
		global: { headers: { Authorization: `Bearer ${jwt}` } }
	});
	const {
		data: { user },
		error
	} = await supabase.auth.getUser(jwt);
	if (error || !user) {
		throw new OpError('UNAUTHENTICATED', 'Invalid or expired credentials.');
	}
	return {
		ctx: {
			supabase,
			admin: event.locals.supabaseAdmin,
			userId: user.id,
			source,
			signal: event.request.signal
		},
		authMethod
	};
}
