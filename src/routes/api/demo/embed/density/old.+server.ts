/**
 * This API endpoint takes a search query and returns the most similar ingredient
 * to the query based on the embeddings of the ingredient names (pre-calculated
 * using the script src/lib/scripts/generate-density-embeddings.ts).
 */

import type { IngredientDensities } from '$lib/scripts/generate-density-embeddings.js';
import { HUGGINGFACE_API_KEY } from '$env/static/private';
import { HfInference } from '@huggingface/inference';
import { cosineSimilarity } from '$lib/utils';
import { json } from '@sveltejs/kit';

// TODO
const densitiesUrl =
	'https://firebasestorage.googleapis.com/v0/b/madeinpierre-cuicuit.appspot.com/o/ingredient-densities.json?alt=media&token=18e98f26-0b68-4c79-8323-ed4e796a9ddd';

let ingredientDensities: IngredientDensities;
let ingredientNames: string[];

const model = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2';
const hf = new HfInference(HUGGINGFACE_API_KEY);

export async function GET(event) {
	// If the ingredient densities have not been fetched yet, fetch them
	if (!ingredientDensities) {
		console.log('fetching data');
		const response = await fetch(densitiesUrl);
		ingredientDensities = (await response.json()) as IngredientDensities;
		ingredientNames = Object.keys(ingredientDensities);
	}

	// Get the search query from the request headers
	const query = event.request.headers.get('search-query');

	// Enforce that a search query is provided
	if (!query) {
		return json({ error: 'No search query provided' }, { status: 400 });
	}

	// Embed the search query
	console.log(`Embedding search query: ${query}`);
	const queryEmbedding = (await hf.featureExtraction({ model, inputs: query })) as number[];

	// Sort the cosine similarity between the search query and all ingredients
	const sortedCandidates = ingredientNames
		.map((name, i) => ({
			score: cosineSimilarity(queryEmbedding, ingredientDensities[name].embedding),
			name
		}))
		.sort((a, b) => b.score - a.score);

	// Display the 5 most similar ingredients
	for (let i = 0; i < 5; i++) {
		console.log(
			'\x1b[33m-',
			sortedCandidates[i].score.toPrecision(3),
			'\x1b[0m',
			sortedCandidates[i].name
		);
	}

	// Return the most similar ingredient
	const bestMatch = {
		name: sortedCandidates[0].name,
		density: ingredientDensities[sortedCandidates[0].name].density,
		similarity: sortedCandidates[0].score
	};

	return json(bestMatch, {
		status: 200,
		headers: {}
	});
}
