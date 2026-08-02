import type { SupabaseClient } from '@supabase/supabase-js/dist/index.mjs';
import type { Database } from './supabase.types.ts';

// export function createSupabaseClient() {
// 	return createClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY);
// }

/**
 * Browser-only Supabase client singleton (populated in the root `+layout.ts` browser branch).
 *
 * Do NOT read or write `supabase.client` from server-side code (`+page.server.ts`,
 * `+layout.server.ts`, `+server.ts`, `.remote.ts`). The server is a shared, long-running
 * process (and may be a warm/shared instance under Vercel Fluid compute), so a module-level
 * client there would leak one request's/user's session into another's. Server code must
 * always use the per-request client from `event.locals.supabase` /
 * `getRequestEvent().locals.supabase` instead.
 */

function createSupabaseClientState() {
	let client: SupabaseClient<Database> | undefined = $state(undefined);
	return {
		get client() {
			return client;
		},
		set client(c) {
			client = c;
		}
	};
}

export let supabase = createSupabaseClientState();
