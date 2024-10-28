import type { SpaceUserHeader } from '$lib/features/auth/db/user-doc';
import { firestore } from '$lib/shared/db/firebase-client';
import { doc, collection, setDoc } from 'firebase/firestore';
import type { SpaceDoc } from '../db/space-doc';
import type { UserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
import type { SpaceIconKey, SpaceThemeKey } from '../consts';

// TODO better types for theme and icon
export async function createSpace(
	userDocState: UserDocState,
	name: string,
	theme: SpaceThemeKey,
	icon: SpaceIconKey
) {
	if (!firestore) throw new Error('Error: Firestore or user not available');
	if (!userDocState.user) throw new Error('Error: User not available');
	if (!userDocState.docState || !userDocState.doc)
		throw new Error('Error: UserDocState not available');

	// Check if the user already has a space with the same name
	if (Object.values(userDocState.doc.spaces).some((space) => space.name === name)) {
		throw new Error('space-already-exists');
	}

	// Create the list in Firestore
	const spaceDocRef = doc(collection(firestore, 'spaces'));

	const now = new Date();

	await setDoc(spaceDocRef, {
		name,
		created_t: now,
		updated_t: now,
		memberProfiles: {
			[userDocState.user.uid]: {
				firstName: userDocState.doc.firstName,
				lastName: userDocState.doc.lastName,
				userName: userDocState.doc.userName,
				avatar: userDocState.doc.avatar
			}
		},
		locale: navigator.language || navigator.languages[0]
	} satisfies SpaceDoc);

	// Add the space id and header to the userDoc's spaces
	userDocState.docState.updateDoc({
		[`spaces.${spaceDocRef.id}`]: { name, theme, icon } satisfies SpaceUserHeader
	});

	// Create list content doc
	// const contentDocRef = doc(firestore, spaceDocRef.path, 'data', 'content');

	// await setDoc(contentDocRef, {
	// 	items: {},
	// 	recipes: [],
	// 	updated_t: Date.now()
	// } as ListContent);

	return spaceDocRef.id;
}
