import { supabase } from '$lib/shared/db/supabase-client.svelte';

export async function getUserSpacesWithMembers(userId: string) {
	if (!supabase.client) throw new Error('No supabase');

	let { data: userSpaces, error } = await supabase.client
		.from('space_members')
		.select(
			`
		...space_id(
			*, 
			members:space_members(*),
			language:languages(*)
            )`
		)
		.eq('user_id', userId);

	if (error) throw error;
	if (!userSpaces) return [];

	return userSpaces;
}

export type ActiveSpaceWithMembers =
	ReturnType<typeof getUserSpacesWithMembers> extends Promise<infer T>
		? T extends Array<infer U>
			? U
			: never
		: never;
