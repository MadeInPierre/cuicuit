import type { UserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
import { firestore } from '$lib/shared/db/firebase-client';
import { deleteDoc, deleteField } from 'firebase/firestore';
import type { ActiveSpaceState } from '../state/active-space.svelte';

export async function leaveSpace(
	userDocState: UserDocState,
	activeSpace: ActiveSpaceState,
	id: string
) {
	if (!firestore) throw new Error('Error: Firestore or user not available');
	if (!userDocState.user) throw new Error('Error: User not available');
	if (!userDocState.docState || !userDocState.doc)
		throw new Error('Error: UserDocState not available');
	if (!activeSpace.docState || !activeSpace.doc)
		throw new Error('Error: ActiveSpaceState not available');

	// Check that the id is a valid space id
	if (!userDocState.doc.spaces[id]) throw new Error('Error: Invalid space id');

	// Check that the active space is the space being left
	if (activeSpace.id !== id) throw new Error('Error: Active space is not the space being left');

	// Check that this isn't the last space the user is a member of
	if (Object.keys(userDocState.doc.spaces).length === 1) throw new Error('last-space-of-user');

	// Remove the space id from the userDoc's space headers
	await userDocState.docState.updateDoc({
		[`spaces.${id}`]: deleteField()
	});

	// Remove the user from the spaceDoc
	if (Object.keys(activeSpace.doc.memberProfiles).length === 1) {
		// If the user is the last member, delete the space
		await deleteDoc(activeSpace.docState?.ref);
	} else {
		// If the user is not the last member, just remove the user from the space's memberProfiles
		await activeSpace.docState?.updateDoc({
			[`memberProfiles.${userDocState.user.uid}`]: deleteField()
		});
	}

	// Set the active space to the first in the userDoc's spaces
	activeSpace.id = Object.keys(userDocState.doc.spaces)[0];
}
