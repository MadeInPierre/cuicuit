import { supabase } from '$lib/shared/db/supabase-client';

export async function leaveSpace(userId: string, spaceId: string) {
	if (!supabase) throw new Error('Error: Supabase client not available');
	if (!userId) throw new Error('Error: User ID not provided');
	if (!spaceId) throw new Error('Error: Space ID not provided');

	// Check that the id is a valid space id
	const { data: space, error: fetchError } = await supabase
		.from('spaces')
		.select('id')
		.eq('id', spaceId)
		.single();
	if (fetchError) throw fetchError;
	if (!space) throw new Error('space-not-found');

	// Check that the active space is the space being left
	// TODO

	// Check that this isn't the last space the user is a member of
	const { data: members, error: membersError } = await supabase
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

	// Set the active space to the first in the userDoc's spaces
	// TODO activeSpace.id = Object.keys(userDocState.doc.spaces)[0];
}
