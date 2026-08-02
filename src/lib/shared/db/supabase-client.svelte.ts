import type { SupabaseClient } from '@supabase/supabase-js/dist/index.mjs';
import type { Database } from './supabase.types.ts';

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
