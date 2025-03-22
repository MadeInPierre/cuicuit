// DEPRECATED: This script is deprecated and should not be used anymore.
//
// To run: npx tsx src/lib/admin/create-marmiton-ingredients.ts
//
// This script takes the JSON ingredients and image files generated from the Marmiton python scraper
// and uploads them to Firebase Storage and Firestore.
// It assumes the content has already been downloaded to a file ingredients.json
// Then, it uploads each ingredient to firestore (image when available and data about the ingredient)

import { config } from 'dotenv'; // npm install dotenv
import admin from 'firebase-admin';
import { getDownloadURL } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';

// Initialize firebase admin
config(); // Get .env secrets
const firebaseAdmin = admin.initializeApp({
	credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_KEY!)),
	storageBucket: 'madeinpierre-cuicuit.appspot.com'
});
const firestore = firebaseAdmin.firestore();
const storage = firebaseAdmin.storage();

function readJsonFile(filePath: string) {
	try {
		filePath = path.join(path.dirname(new URL(import.meta.url).pathname), filePath);
		const jsonData = fs.readFileSync(filePath, 'utf-8');
		return JSON.parse(jsonData);
	} catch (error) {
		console.error('Error reading JSON file:', error);
		return null;
	}
}

type IngredientsJson = { [slug: string]: { name: string; image: string | null } };
const ingredients: IngredientsJson = readJsonFile(
	'../../../static/ingredients/marmiton_ingredients.json'
);

type Ingredient = {
	slug: string;
	name: string;
	imageUrl: boolean;
};

// Convert JSON data to Ingredient[]
const ingredientsList: Ingredient[] = Object.entries(ingredients).map(
	([slug, { name, image }]) => ({
		slug,
		name,
		imageUrl: image ? true : false
	})
);

type IngredientDoc = {
	slug: string;
	name: string;
	imageUrl: string | null;
	embedding: number[];
};

// Upload each ingredient to Firestore
export for (const item of ingredientsList) {
	// Upload image to Firebase Storage
	let imageUrl: string | null = null;
	if (item.imageUrl) {
		console.log('Uploading image:', item.slug);

		const filePath = path.join(
			path.dirname(new URL(import.meta.url).pathname),
			`../../../static/ingredients/marmiton/${item.slug}.jpg`
		);

		const fileBuffer = fs.readFileSync(filePath);
		const destination = `ingredients/marmiton/${item.slug}.jpg`;

		const file = storage.bucket().file(destination);
		await file.save(fileBuffer, {
			metadata: {
				contentType: 'image/jpeg'
			}
		});

		const imageRef = storage.bucket().file(destination);
		imageUrl = await getDownloadURL(imageRef);
	}

	// Create a new document
	const data = { slug: item.slug, name: item.name, imageUrl } as IngredientDoc;

	// Create a new document in Firestore
	await firestore.collection('ingredients-marmiton').doc(item.slug).set(data);
	console.log('Created', data);
}

// Create a JSON file with the ingredients list
const ingredientsListWithImageUrls = await Promise.all(
	ingredientsList.map(async (item) => {
		if (item.imageUrl) {
			const imageRef = storage.bucket().file(`ingredients/marmiton/${item.slug}.jpg`);
			const imageUrl = await getDownloadURL(imageRef);
			console.log('imageUrl', imageUrl);
			return { ...item, imageUrl };
		}
		return item;
	})
);
const ingredientsListJson = JSON.stringify(ingredientsListWithImageUrls, null, 2);
fs.writeFileSync('./marmiton_ingredients_list.json', ingredientsListJson);

// Update the ingredient documents to add the embeddings
import { HfInference } from '@huggingface/inference';
import { FieldValue } from 'firebase-admin/firestore';
const model = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2';
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY!);

// Embed all ingredient names
const names = ingredientsList.map((item) => `Ingredient: ${item.name}`);
const output = (await hf.featureExtraction({ model, inputs: names })) as number[][];

// Update the Firestore documents with the embeddings
export for (let i = 0; i < names.length; i++) {
	console.log(`${i + 1}/${names.length}`, 'Updating', ingredientsList[i].slug);
	const item = ingredientsList[i];

	await firestore
		.collection('ingredients-marmiton')
		.doc(item.slug)
		.update({
			embedding: FieldValue.vector(output[i])
		});

	// @ts-ignore (dirty code types, whatever)
	ingredientsList[i] = { ...item, embedding: output[i] };
}

// // Write the embeddings to a json file ./embeddings.json
fs.writeFileSync(
	'./static/ingredients-marmiton-embeddings.json',
	JSON.stringify(ingredientsList, null, 4)
);

// Upload this file to storage
const fileBuffer = fs.readFileSync('./static/ingredients-marmiton-embeddings.json');
const destination = `ingredients-marmiton-embeddings.json`;
const file = storage.bucket().file(destination);
await file.save(fileBuffer, {
	metadata: {
		contentType: 'application/json'
	}
});
