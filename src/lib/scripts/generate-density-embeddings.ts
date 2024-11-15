/**
 * This script demonstrates how to calculate embeddings for a list of ingredient names
 * and store them in a json file. It then demonstrates how to load the embeddings
 * from the file and use them to find the most similar ingredients to a query name.
 *
 * The JSON file could then be downloaded and used in a web application to find
 * similar ingredients to a user query.
 *
 * Command to run the script: npx tsx ./quantity.ts (run from the script's directory)
 */

import { HfInference } from '@huggingface/inference';
import { ingredientDensities } from '../data/ingredient-densities';
import { HUGGINGFACE_API_KEY } from '$env/static/private';
import fs from 'fs';

const names = Object.keys(ingredientDensities);
const model = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2';
const hf = new HfInference(HUGGINGFACE_API_KEY);

// Define the type for the embeddings file
export type IngredientDensities = Record<string, { embedding: number[]; density: number }>;
let ingredients: IngredientDensities = {};

// Check if the embeddings file already exists
if (!fs.existsSync('./ingredient-densities.json')) {
	// Embed all ingredient names
	const output = (await hf.featureExtraction({ model, inputs: names })) as number[][];

	// Convert the embeddings to a dictionary and add the densities
	for (let i = 0; i < names.length; i++) {
		const key = names[i];
		ingredients[key] = {
			density: ingredientDensities[key as keyof typeof ingredientDensities],
			embedding: output[i]
		};
	}

	// Write the embeddings to a json file ./embeddings.json
	fs.writeFileSync('./ingredient-densities.json', JSON.stringify(ingredients, null, 4));
	console.log('Saved embeddings to file, next step is to upload it to firebase storage manually.');
} else {
	throw new Error('Embeddings file already exists, delete it first.');
}
