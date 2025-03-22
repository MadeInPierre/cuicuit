/**
 * This is an API server endpoint that takes a search query (free-form ingredient text) and returns
 * the 5 most similar ingredients to the query based on a string fuzzy search of the ingredient names.
 *
 * Tutorial: https://fusejs.io/
 */

import Fuse from 'fuse.js';
import { json } from '@sveltejs/kit';

// Load the ingredient lists, must have been pre-generated using the scripts in src/lib/scripts.
import ingredientsFrFr from '$lib/scripts/data/ingredients/lists/ingredients-fr-FR.json';
import ingredientsEnUs from '$lib/scripts/data/ingredients/lists/ingredients-en-US.json';
import ingredientsPtBr from '$lib/scripts/data/ingredients/lists/ingredients-pt-BR.json';
import ingredientsEsEs from '$lib/scripts/data/ingredients/lists/ingredients-es-ES.json';

type IngredientListEntry = {
	singular: string | null;
	plural: string | null;
	isCommonlyUsed: number;
};

type IngredientList = { [slug: string]: IngredientListEntry };

const ingredientLists: { [locale: string]: IngredientList } = {
	'fr-FR': ingredientsFrFr,
	'en-US': ingredientsEnUs,
	'pt-BR': ingredientsPtBr,
	'es-ES': ingredientsEsEs
};

function customScorer(inputStr: string, choice: { name: string; isCommonlyUsed: number }): number {
	const choiceSingular = choice.name.toLowerCase();
	const inputLower = inputStr.toLowerCase();

	// Boost score if the choice is an exact match
	if (choiceSingular === inputLower) {
		return 1000;
	}

	// Base fuzzy score using Fuse.js
	const fuse = new Fuse([choiceSingular], { includeScore: true, threshold: 0.4 });
	const result = fuse.search(inputStr);
	let fuzzScore = result.length > 0 ? (1 - (result[0].score ?? 1)) * 100 : 0;

	// Boost score if the choice starts with inputStr
	if (choiceSingular.startsWith(inputLower)) {
		fuzzScore += 50;
	}

	// Boost score if the choice contains inputStr
	if (choiceSingular.includes(inputLower)) {
		fuzzScore += 50;
	}

	// Boost score based on isCommonlyUsed value
	fuzzScore += choice.isCommonlyUsed * 20;

	// Penalize longer ingredient names
	fuzzScore -= choiceSingular.length - inputLower.length;

	return fuzzScore;
}

export async function GET({ request }) {
	// Get query parameters from headers
	const query = request.headers.get('search-query');
	const locale = request.headers.get('locale') || 'fr-FR';
	const limit = parseInt(request.headers.get('limit') || '10', 10);

	// Validate input
	if (!query) {
		return json({ error: 'No search query provided' }, { status: 400 });
	}

	console.log('query:', query, 'locale:', locale, 'limit:', limit);

	// Fetch ingredient list
	const ingredients = Object.entries(ingredientLists[locale])
		.map(([slug, details]) => ({
			slug,
			name: details.singular || details.plural,
			isCommonlyUsed: details.isCommonlyUsed ?? 0
		}))
		.filter((ingredient) => ingredient.name !== null) as {
		slug: string;
		name: string;
		isCommonlyUsed: number;
	}[];

	// Compute scores for each ingredient
	const scoredMatches = ingredients.map((ingredient) => ({
		...ingredient,
		score: customScorer(query, ingredient)
	}));

	// Sort matches by score (highest first) and limit results
	const bestMatches = scoredMatches.sort((a, b) => b.score - a.score).slice(0, limit);

	console.log('bestMatches:', bestMatches);

	return json({
		matches: bestMatches
	});
}
