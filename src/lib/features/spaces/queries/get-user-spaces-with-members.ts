import { supabase } from '$lib/shared/db/supabase-client';

export async function getUserSpacesWithMembers(userId: string) {
	let { data: userSpaces, error } = await supabase
		.from('space_members')
		.select(
			`
            ...space_id(
                *, 
                members:space_members(*)
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
