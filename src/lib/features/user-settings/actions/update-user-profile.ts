import type { ProfileFormSchema } from '$lib/features/auth/models/schemas';
import type { UserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
import { firestore } from '$lib/shared/db/firebase-client';
import type { Infer } from 'sveltekit-superforms';

// Triggered when a valid profile form is submitted, updates firebase
export async function updateUserProfile(
	userDocState: UserDocState,
	newProfile: Infer<ProfileFormSchema>
) {
	// Validation
	if (!firestore || !userDocState.user || !userDocState.docState) return;

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
}
