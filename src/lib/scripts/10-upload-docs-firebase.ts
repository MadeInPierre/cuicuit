// To run: FIREBASE_ADMIN_KEY='{...}' npx tsx src/lib/scripts/10-upload-docs-firebase.ts
//
// This script takes the JSON ingredients (slug.json files in data/ingredients/docs/*)
// and image files  in the data/ingredients/marmiton downloaded using the Marmiton python scraper
// and uploads them to Firebase Storage and Firestore.
//
// It assumes the list of all ingredients has already been generated to a file data/ingredients/list/ingredients-fr-FR.json
// Then, it uploads each ingredient to firestore.

import admin from 'firebase-admin';
import { getDownloadURL } from 'firebase-admin/storage';
import { FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

const FIREBASE_ADMIN_KEY = process.env.FIREBASE_ADMIN_KEY!;

// Initialize firebase admin
const firebaseAdmin = admin.initializeApp({
	credential: admin.credential.cert(JSON.parse(FIREBASE_ADMIN_KEY)),
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

type IngredientsList = { [slug: string]: any }; // We'll only use the slugs here
const ingredients: IngredientsList = readJsonFile('data/ingredients/lists/ingredients-fr-FR.json');

type IngredientDoc = {
	createdAt: string; // The date when this ingredient was created
	updatedAt: string; // The date when this ingredient was last updated
	slug: string; // The unique identifier for this ingredient, in english and kebab-case (e.g. "butter", "olive-oil", "chicken-breast")
	name: {
		'fr-FR': {
			singular: string | null; // Null if the singular form is never used in recipes for this ingredient
			plural: string | null; // Null if the plural form is never used in recipes for this ingredient
		};
		'en-US': {
			singular: string | null;
			plural: string | null;
		};
		'pt-BR': {
			singular: string | null;
			plural: string | null;
		};
		'es-ES': {
			singular: string | null;
			plural: string | null;
		};
	};
	imageUrl: string | null; // The URL of the image for this ingredient
	generalName: {
		// The general name of this ingredient (e.g. "onion" for "red onion", "white onion", "yellow onion", etc.)
		'fr-FR': string;
		'en-US': string;
		'pt-BR': string;
		'es-ES': string;
	};
	generalSlug: string; // The unique identifier for the general name of this ingredient, in english and kebab-case (e.g. "onion")
	supermarketAisle:
		| 'beverages'
		| 'bread-pastries'
		| 'care-health'
		| 'frozen-convenience'
		| 'fruits-vegetables'
		| 'grain-products'
		| 'home-garden'
		| 'household'
		| 'ingredients-spices'
		| 'meat-fish'
		| 'milk-cheese'
		| 'pet-supplies'
		| 'snacks-sweets'
		| 'unknown'; // The aisle in the supermarket where this ingredient can be most commonly found
	isCommonlyUsed: {
		// The general frequency of use of this ingredient in recipes in each country
		'fr-FR': 'daily' | 'common' | 'occasionally' | 'rare' | 'never';
		'en-US': 'daily' | 'common' | 'occasionally' | 'rare' | 'never';
		'pt-BR': 'daily' | 'common' | 'occasionally' | 'rare' | 'never';
		'es-ES': 'daily' | 'common' | 'occasionally' | 'rare' | 'never';
	};
	quantityUnits: {
		ml: 'default' | 'common' | 'uncommon' | 'rare' | 'never';
		cl: 'default' | 'common' | 'uncommon' | 'rare' | 'never';
		dl: 'default' | 'common' | 'uncommon' | 'rare' | 'never';
		l: 'default' | 'common' | 'uncommon' | 'rare' | 'never';
		tsp: 'default' | 'common' | 'uncommon' | 'rare' | 'never';
		tbsp: 'default' | 'common' | 'uncommon' | 'rare' | 'never';
		dstspn: 'default' | 'common' | 'uncommon' | 'rare' | 'never';
		cup: 'default' | 'common' | 'uncommon' | 'rare' | 'never';
		quart: 'default' | 'common' | 'uncommon' | 'rare' | 'never';
		gallon: 'default' | 'common' | 'uncommon' | 'rare' | 'never';
		floz: 'default' | 'common' | 'uncommon' | 'rare' | 'never';
		pint: 'default' | 'common' | 'uncommon' | 'rare' | 'never';
		g: 'default' | 'common' | 'uncommon' | 'rare' | 'never';
		kg: 'default' | 'common' | 'uncommon' | 'rare' | 'never';
		oz: 'default' | 'common' | 'uncommon' | 'rare' | 'never';
		lb: 'default' | 'common' | 'uncommon' | 'rare' | 'never';
		pinch: 'default' | 'common' | 'uncommon' | 'rare' | 'never'; // for ingredients that can be used in very small quantities
		whole: 'default' | 'common' | 'uncommon' | 'rare' | 'never'; // for countable ingredients eggs, tomatoes, etc.
	};
	gPerUnit: {
		// the weight in grams of one unit of this ingredient, null if the ingredient is not countable
		small: number; // The weight in grams of one small unit of this ingredient, but still commonly found in supermarkets
		medium: number; // The weight in grams of one common unit of this ingredient, most commonly found in supermarkets
		large: number; // The weight in grams of one large unit of this ingredient, but still commonly found in supermarkets
	} | null; // null if the ingredient is not countable
	density: number | null; // the density of this ingredient in g/ml, null if the density is not applicable
	kcalPer100g: number | null; // the energy in kilocalories per 100g of this ingredient
	substitutions: {
		// Ingredients that can be used as a substitute for this ingredient. Slugs must be in French.
		equivalent: {
			// Ingredients that are equivalent to this ingredient in recipes, they can be used as a substitute in most recipes without changing the taste or texture
			[slug: string]: number; // The weight ratio between this ingredient and the substitute, e.g. 1.0 means 100g of butter can be replaced by 100g of margarine
		};
		similar: {
			// Ingredients that are similar to this ingredient, they can be used as a substitute in some recipes without changing the taste or texture
			[slug: string]: number; // Same as above
		};
		far: {
			// Ingredients that are far from this ingredient, they could be used as a substitute in some recipes but the taste or texture might be different
			[slug: string]: number; // Same as above
		};
		variants: {
			// Ingredients that completely change the taste or texture of the recipe, but could still be used as a substitute in some recipes
			[slug: string]: number; // Same as above
		};
	};
	hierarchy: string[]; // The hierarchy of this ingredient in the ingredient taxonomy
	embedding: number[]; // The embedding of this ingredient
};

// Convert JSON data to Ingredient[]
const ingredientSlugs: string[] = Object.keys(ingredients);

// Upload each ingredient to Firestore
for (const slug of ingredientSlugs) {
	// Load the ingredient data
	const filePath = `data/ingredients/docs/${slug}.json`;
	const doc = readJsonFile(filePath) as IngredientDoc;
	if (!doc) {
		console.error('Error reading JSON file:', filePath);
		continue;
	}

	// Upload image to Firebase Storage
	const imageDestination = `ingredients/marmiton/${slug}.jpg`;
	console.log('Uploading image for:', doc.slug, 'to', imageDestination);
	// const imagePath = `data/ingredients/marmiton/${slug}.jpg`;
	// const imageBuffer = fs.readFileSync(imagePath);
	// const imageFile = storage.bucket().file(imageDestination);
	// await imageFile.save(imageBuffer, { metadata: { contentType: 'image/jpeg' } });

	// Get a download URL for the image
	const imageRef = storage.bucket().file(imageDestination);
	const imageUrl = await getDownloadURL(imageRef);

	// Set the image URL in the document
	doc.imageUrl = imageUrl;

	// Upload the document to Firestore
	console.log('Uploading document for:', doc.slug);
	await firestore
		.collection('ingredients-marmiton')
		.doc(doc.slug)
		.set({
			...doc,
			embedding: FieldValue.vector(doc.embedding),
			createdAt: FieldValue.serverTimestamp(),
			updatedAt: FieldValue.serverTimestamp()
		});
	console.log('Created', doc);
}

// Upload the language lists of ingredients to Firestore storage
const languages = ['fr-FR', 'en-US', 'pt-BR', 'es-ES'];
for (const language of languages) {
	const filePath = `data/ingredients/lists/ingredients-${language}.json`;
	const list = readJsonFile(filePath) as string[];
	if (!list) {
		console.error('Error reading JSON file:', filePath);
		continue;
	}

	console.log('Uploading list of ingredients for:', language);
	await storage
		.bucket()
		.file(`ingredients/list/ingredients-${language}.json`)
		.save(JSON.stringify(list), { metadata: { contentType: 'application/json' } });
}
