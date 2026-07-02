import type { SupabaseClient } from '@supabase/supabase-js/dist/index.mjs';
import type { Database } from './supabase.types.ts';

// export function createSupabaseClient() {
// 	return createClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY);
// }

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
