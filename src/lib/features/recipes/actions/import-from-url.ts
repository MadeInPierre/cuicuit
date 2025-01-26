import { firestore } from '$lib/shared/db/firebase-client';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import type { RecipeDoc, RecipeIngredient } from '../db/recipe-doc';
import type { UserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
import { createDraftRecipe } from './create-draft-recipe';
import { uploadRecipeImage } from './upload-recipe-image';
import { capitalize } from '$lib/utils';

const SCRAPER_API_URL = 'http://localhost:8000/scrape-recipe';

// See the scraper source code for the expected response format,
// don't forget to update this type if the scraper response changes.
type ScraperResponse = {
	source: {
		name: string;
		domain: string;
		url: string;
	};
	title: string;
	description: string;
	image: string;
	author: string;
	servings: string;
	ingredients: [{ ingredients: string[]; purpose: string }]; // TODO slice quantities
	instructions: string[];
	time: {
		prep: string;
		cook: string;
		rest: string;
		total: string;
	};
	ratings: string;
	category: string;
	language: string;
};

/**
 * Imports a recipe from a URL and creates a new recipe
 * document with as much data as possible already filled in.
 * If the data is incomplete, the user will be prompted to
 * fill in the missing fields.
 *
 * @param url The URL to import the recipe from.
 * @param userDocState The user document state.
 * @returns An object containing the ID of the imported recipe
 * and a boolean indicating if the data is complete.
 */
export async function importFromUrl(
	url: string,
	userDocState: UserDocState,
	recipeId?: string | null
): Promise<{ id: string; isComplete: boolean }> {
	// TODO Move to server?
	if (!userDocState.user || !userDocState.doc) throw new Error('No user to import the recipe for');

	const response = await fetch(SCRAPER_API_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ url })
	});

	const data = (await response.json()) as ScraperResponse;
	console.log('fetched recipe data', data);

	// Create an empty draft recipe if no existing recipe document ID is provided
	if (!recipeId) {
		recipeId = await createDraftRecipe(userDocState);
	}
	const docRef = doc(firestore, 'recipes', recipeId);

	// Get the current recipe document
	const docSnap = (await getDoc(docRef)).data() as RecipeDoc;

	// Download & store the image to firestore, and update the recipe
	try {
		const imgResponse = await fetch(data.image);
		const blob = await imgResponse.blob();
		await uploadRecipeImage(recipeId, docSnap, blob);
	} catch (error) {
		console.error('Failed to download the image:', error);
	}

	// Add the imported data to the draft recipe (existing data will be overwritten)
	await updateDoc(docRef, {
		modified_t: new Date(),
		language: data.language as 'fr' | 'en',
		source: {
			name: data.source.name,
			domain: data.source.domain,
			url: data.source.url,
			author: data.author
		},
		author: {
			uid: userDocState.user.uid,
			profile: {
				firstName: userDocState.doc.firstName,
				lastName: userDocState.doc.lastName,
				userName: userDocState.doc.userName,
				avatar: userDocState.doc.avatar
			}
		},
		title: capitalize(data.title),
		description: capitalize(data.description || ''),
		// The image is handled above
		time: {
			prep: parseInt(data.time.prep),
			cook: parseInt(data.time.cook),
			rest: parseInt(data.time.rest),
			total: parseInt(data.time.total)
		},
		servings: parseInt(data.servings),
		ratings: {
			1: 0,
			2: 0,
			3: 0,
			4: 0,
			5: 0,
			count: 0,
			average: parseFloat(data.ratings)
		},
		steps: data.instructions.map((instruction, _) => ({
			description: instruction,
			ingredients: [] as RecipeIngredient[]
		})),
		ingredients: data.ingredients.flatMap((group) =>
			group.ingredients.map(
				(ingredient) =>
					({
						name: ingredient,
						amount: -1,
						unit: 'g'
					}) as RecipeIngredient
			)
		)
	} as RecipeDoc);

	// Check if the data is complete
	const isComplete = false; // TODO

	return { id: docRef.id, isComplete };
}
