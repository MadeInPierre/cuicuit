import { firestore, storage } from '$lib/shared/db/firebase-client';
import { collection, deleteDoc, doc, setDoc } from 'firebase/firestore';
import type { DBRecipeDoc, RecipeDoc } from '../db/recipe-doc';
import type { UserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
import type { DocState } from '$lib/shared/db/doc-state.svelte';
import { listAll, ref, deleteObject } from 'firebase/storage';

/**
 * Deletes a recipe document in the recipes collection
 * @returns the id of the deleted recipe
 */
export async function deleteRecipe(recipeDocState: DocState<RecipeDoc, DBRecipeDoc>) {
	if (!recipeDocState.id) {
		throw new Error('No recipe to delete');
	}
	const id = recipeDocState.id;

	// Delete the document in the recipes collection
	const docRef = doc(collection(firestore, 'recipes'), recipeDocState.id);
	await deleteDoc(docRef);

	// Delete the folder recipes/{recipeId} in the storage
	const folderRef = ref(storage, `recipes/${recipeDocState.id}`);
	await listAll(folderRef).then((listResults) => {
		const promises = listResults.items.map((item) => {
			return deleteObject(item);
		});
		Promise.all(promises);
	});

	// Return the id of the deleted recipe
	return id;
}
