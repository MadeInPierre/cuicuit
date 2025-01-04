import { firestore } from '$lib/shared/db/firebase-client';
import { collection, doc, setDoc } from 'firebase/firestore';
import type { RecipeDoc } from '../db/recipe-doc';
import type { UserDocState } from '$lib/features/auth/state/user-doc-state.svelte';

/**
 * Creates a new draft recipe document in the recipes collection
 * @returns the id of the newly created draft recipe
 */
export async function createDraftRecipe(userDocState: UserDocState): Promise<string> {
	if (!userDocState.user || !userDocState.doc) {
		throw new Error('No user to create the draft recipe for');
	}

	// Create a new document in the recipes collection with the <status: 'draft'> field
	const docRef = doc(collection(firestore, 'recipes'));

	// Set the initial data of the draft recipe
	await setDoc(docRef, {
		status: 'draft',
		author: {
			uid: userDocState.user.uid,
			profile: {
				firstName: userDocState.doc.firstName,
				lastName: userDocState.doc.lastName,
				userName: userDocState.doc.userName,
				avatar: userDocState.doc.avatar
			}
		},
		created_t: new Date(),
		modified_t: new Date()
		// Other fields are left empty, will be filled in once the user starts editing the recipe
	} as RecipeDoc);

	// Return the id of the newly created draft recipe
	return docRef.id;
}
