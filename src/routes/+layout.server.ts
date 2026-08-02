import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	// Give +layout.ts the cookies to setup the supabase server client
	return {
		cookies: cookies.getAll()
	};
};
