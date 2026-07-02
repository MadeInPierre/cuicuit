import { supabase } from '$lib/shared/db/supabase-client.svelte';

export async function leaveSpace(userId: string, spaceId: string) {
	if(!supabase.client) throw new Error("No supabase client");
	if (!userId) throw new Error('Error: User ID not provided');
	if (!spaceId) throw new Error('Error: Space ID not provided');

	// Check that the id is a valid space id
	const { data: space, error: fetchError } = await supabase.client
		.from('spaces')
		.select('id')
		.eq('id', spaceId)
		.single();
	if (fetchError) throw fetchError;
	if (!space) throw new Error('space-not-found');

	// Check that this isn't the last space the user is a member of
	const { data: members, error: membersError } = await supabase.client
		.from('space_members')
		.select('space_id')
		.eq('user_id', userId);
	if (membersError) throw membersError;
	if (members.length <= 1) {
		throw new Error('last-space-member');
	}
	if (!members.some((member) => member.space_id === spaceId)) {
		throw new Error('not-a-member');
	}

	// Remove the user from the space members
	const { error: memberError } = await supabase.client
		.from('space_members')
		.delete()
		.eq('user_id', userId)
		.eq('space_id', spaceId);
	if (memberError) throw memberError;
}
