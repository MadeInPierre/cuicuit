import type { SpaceUserHeader } from '$lib/features/auth/db/user-doc';
import { firestore } from '$lib/shared/db/firebase-client';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { spaceDocConverter } from '../db/space-doc';
import type { UserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
import type { SpaceThemeKey } from '../consts';
import type { UserProfile } from 'firebase/auth';

export async function joinSpace(userDocState: UserDocState, id: string, theme: SpaceThemeKey) {
	console.log('Joining space:', id, theme);

	if (!firestore) throw new Error('Error: Firestore or user not available');
	if (!userDocState.user) throw new Error('Error: User not available');
	if (!userDocState.docState || !userDocState.doc)
		throw new Error('Error: UserDocState not available');

	// Check if the space exists and get its document
	const spaceDocRef = doc(firestore, `spaces/${id}`).withConverter(spaceDocConverter);
	const spaceDoc = await getDoc(spaceDocRef);
	if (!spaceDoc.exists()) {
		throw new Error('space-not-found');
	}
	const data = spaceDoc.data();

	// Add the space id and header to the userDoc's spaces
	userDocState.docState.updateDoc({
		[`spaces.${id}`]: {
			name: data.name,
			icon: data.icon,
			theme
		} as SpaceUserHeader
	});

	// Add the user to the space's memberProfiles
	await updateDoc(spaceDocRef, {
		[`memberProfiles.${userDocState.user.uid}`]: {
			firstName: userDocState.doc.firstName,
			lastName: userDocState.doc.lastName,
			userName: userDocState.doc.userName,
			avatar: userDocState.doc.avatar
		} as UserProfile,
		// serverTimestamp() is a placeholder for the actual timestamp
		updated_t: serverTimestamp()
	});
}
