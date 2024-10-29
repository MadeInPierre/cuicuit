import type { ProfileFormSchema } from '$lib/features/auth/models/schemas';
import type { UserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
import type { SpaceDoc } from '$lib/features/spaces/db/space-doc';
import { firestore } from '$lib/shared/db/firebase-client';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import type { Infer } from 'sveltekit-superforms';

// TODO Maybe separate the user profile info in a separate collection [profiles/userName]?

// Triggered when a valid profile form is submitted, updates firebase
export async function updateUserProfile(
	userDocState: UserDocState,
	newProfile: Infer<ProfileFormSchema>
) {
	// Validation
	if (!firestore || !userDocState.user || !userDocState.docState || !userDocState.doc) return;

	if (!newProfile.firstName && !newProfile.lastName && !newProfile.userName) {
		throw new Error('Missing profile information');
	}

	// Make sure typescript approves the new data when calling docState.updateDoc
	type NewData = {
		firstName?: string;
		lastName?: string;
		userName?: string;
	};

	// Filter out empty fields
	const newData: NewData = Object.fromEntries(
		Object.entries(newProfile).filter(([_, v]) => Boolean(v))
	);

	// Update the user profile info in firestore (ignore empty fields)
	userDocState.docState.updateDoc(newData);

	// Also update the profile copy in the user's spaces [firestore space/spaceId]
	for (const spaceId of Object.keys(userDocState.doc.spaces)) {
		const spaceDocRef = doc(firestore, `spaces/${spaceId}`);

		await updateDoc(spaceDocRef, {
			[`memberProfiles.${userDocState.user.uid}.firstName`]: newData.firstName,
			[`memberProfiles.${userDocState.user.uid}.lastName`]: newData.lastName,
			[`memberProfiles.${userDocState.user.uid}.userName`]: newData.userName
		});
	}
}
