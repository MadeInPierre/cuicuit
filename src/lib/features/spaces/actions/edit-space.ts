import type { DBUserDoc } from '$lib/features/auth/db/user-doc';
import { firestore } from '$lib/shared/db/firebase-client';
import type { UserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
import type { SpaceIconKey, SpaceThemeKey } from '../consts';
import type { ActiveSpaceState } from '../state/active-space.svelte';

// Note: Since it's hard to have permissions to update each member's userDocs to
// update their headers, we can just update the spaceDoc fields and let
// the userDoc headers be updated when each user opens the space. This is handled
// in the ActiveSpaceState store, which listens to the spaceDoc changes and updates
// the userDoc headers whenever there is a difference.

export async function editSpace(
	userDocState: UserDocState,
	activeSpace: ActiveSpaceState,
	name: string,
	theme: SpaceThemeKey,
	icon: SpaceIconKey
) {
	if (!firestore) throw new Error('Error: Firestore or user not available');
	if (!activeSpace.doc) throw new Error('Error: ActiveSpaceState not available');
	if (!userDocState.user) throw new Error('Error: User not available');
	if (!userDocState.docState || !userDocState.doc)
		throw new Error('Error: UserDocState not available');

	// Forbid to user a name already in use by another space owned by the user
	const hasSpaceWithSameName = Object.entries(userDocState.doc.spaces).some(
		([id, header]) => header.name === name && id !== activeSpace.id
	);
	if (hasSpaceWithSameName) throw new Error('space-already-exists');

	// Update the name & icon in the spaceDoc data in Firestore
	activeSpace.docState?.updateDoc({ name, icon });

	// Update the theme in the userDoc's space header
	userDocState.docState.updateDoc({
		[`spaces.${activeSpace.id}.theme`]: theme
	});
}
