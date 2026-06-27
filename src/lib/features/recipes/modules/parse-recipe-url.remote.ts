import { query } from '$app/server';
import { PUBLIC_CUICUIT_SCRAPER_URL } from '$env/static/public';
import { importRecipeUrlSchema } from '../models/schemas';

const SCRAPER_API_URL = `${PUBLIC_CUICUIT_SCRAPER_URL}/scrape-recipe`;

// See the scraper source code for the expected response format.
// Don't forget to update this type if the scraper response changes.
export type RecipeParsed = {
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
	ingredients: [{ ingredients: string[]; purpose: string }]; // Array of ingredient groups
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

export const parseRecipeUrl = query(importRecipeUrlSchema, async (input) => {
	if (!input.url) {
		return new Response(JSON.stringify({ error: 'Invalid input URL parameter' }), { status: 400 });
	}

	const response = await fetch(SCRAPER_API_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ url: input.url })
	});

	const data = (await response.json()) as RecipeParsed;
	console.log('Fetched recipe object:', data);
	return data as RecipeParsed;
});
