/**
 * TODO DEPRECATED?? Maybe replaced by api/ingredients/search/+server.ts
 *
 * This API endpoint takes a search query (free-form ingredient text) and returns
 * the 5 most similar ingredients to the query based on the embeddings of the
 * ingredient names (pre-calculated using the script
 * src/lib/scripts/create-marmiton-ingredients.ts).
 *
 * Tutorial: https://firebase.google.com/docs/firestore/vector-search#node.js
 */

import { HUGGINGFACE_API_KEY } from '$env/static/private';
import { HfInference } from '@huggingface/inference';
import { json } from '@sveltejs/kit';

const model = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2';
const hf = new HfInference(HUGGINGFACE_API_KEY);

type Match = { slug: string; name: string; imageUrl: string; distance: number };

/**
 * To use this endpoint, you need to create a Firestore index first using:
 * gcloud firestore indexes composite create --collection-group=ingredients-marmiton --query-scope=COLLECTION --field-config=field-path=embedding,vector-config='{"dimension":"384", "flat": "{}"}' --database="(default)"
 */

export async function GET(event) {
	// const firestore = getFirebaseAdminFirestore();

	// // Get the search query from the request headers
	// const query = event.request.headers.get('search-query');
	// const limit = parseInt(event.request.headers.get('limit') || '3');

	// // Enforce that a search query is provided
	// if (!query) {
	// 	return json({ error: 'No search query provided' }, { status: 400 });
	// }

	// // Embed the search query
	// console.log(`Embedding search query: ${query}`);
	// const queryEmbedding = (await hf.featureExtraction({ model, inputs: query })) as number[];

	// // Find the 5 most similar ingredients to the search query using firestore vector search
	// const vectorQuery = await firestore.collection('ingredients-marmiton').findNearest({
	// 	vectorField: 'embedding',
	// 	queryVector: queryEmbedding,
	// 	limit,
	// 	distanceMeasure: 'COSINE',
	// 	distanceResultField: 'vector_distance'
	// });
	// const snapshot = await vectorQuery.get();

	// // Create an array of matches
	// let matches: Match[] = [];
	// snapshot.forEach((doc) => {
	// 	matches.push({
	// 		slug: doc.id,
	// 		name: doc.get('name'),
	// 		imageUrl: doc.get('imageUrl'),
	// 		distance: doc.get('vector_distance')
	// 	});
	// });

	// // Sort the matches by distance
	// matches.sort((a, b) => b.distance - a.distance);

	// // Display the most similar ingredients
	// matches.forEach((match) => {
	// 	console.log('\x1b[33m-', match.distance.toPrecision(3), '\x1b[0m', match.name);
	// });

	// return json(matches, {
	// 	status: 200,
	// 	headers: {}
	// });
	return json({ error: 'This needs migration to supabase.' }, { status: 410 });
}
