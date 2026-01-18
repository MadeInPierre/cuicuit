import { PUBLIC_CUICUIT_SCRAPER_URL } from '$env/static/public';

const SCRAPER_API_URL = `${PUBLIC_CUICUIT_SCRAPER_URL}/scrape-recipe`;

// See the scraper source code for the expected response format.
// Don't forget to update this type if the scraper response changes.
export type ScraperResponse = {
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
 * POST /api/recipes/import-from-url
 * Receives a JSON body with a "url" field and returns the scraped recipe data.
 * 
 * This is just a proxy to the Cuicuit scraper API to avoid CORS issues.
 */
export async function POST({ request }) {
	const body = (await request.json()) as { url: string };
	const url: string = body.url;

	if (!url || typeof url !== 'string') {
		return new Response(JSON.stringify({ error: 'Invalid input URL parameter' }), { status: 400 });
	}

	const response = await fetch(SCRAPER_API_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ url })
	});

	const data = (await response.json()) as ScraperResponse;
	console.log('Fetched recipe object:', data);
	return new Response(JSON.stringify(data), { status: 200 });
}
