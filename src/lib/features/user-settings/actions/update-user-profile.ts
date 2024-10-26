import type { ProfileFormSchema } from '$lib/features/auth/models/schemas';
import { userState } from '$lib/features/auth/state/user.svelte';
import { firestore } from '$lib/shared/db/firebase-client';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import type { Infer } from 'sveltekit-superforms';

// Triggered when a valid profile form is submitted, updates firebase
export async function updateUserProfile(newProfile: Infer<ProfileFormSchema>) {
	// Validation
	if (!firestore || !userState.user) return;

	if (!newProfile.firstName && !newProfile.lastName && !newProfile.userName) {
		throw new Error('Missing profile information');
	}

	// Update the user profile info in firestore (ignore empty fields)
	// TODO maybe just set the userDocState.doc and implement auto-write in the class?
	const docRef = doc(firestore, 'users', userState.user.uid);
	const newData = Object.fromEntries(Object.entries(newProfile).filter(([_, v]) => Boolean(v)));
	await updateDoc(docRef, newData).catch((error) => {
		console.log("Couldn't update doc, trying to set it.", error);
		setDoc(docRef, newData, { merge: true });
	});
}
