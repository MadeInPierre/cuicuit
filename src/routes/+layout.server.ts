import { supabase } from '$lib/shared/db/supabase-client.svelte';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, locals: { supabase: sb } }) => {
	// Make the supabase client (server or brower) available globally
	supabase.client = sb;

	// Give +layout.ts the cookies to setup the supabase server client
	return {
		cookies: cookies.getAll()
	};
};
