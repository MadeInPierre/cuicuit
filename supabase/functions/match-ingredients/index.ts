// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { createClient } from 'https://esm.sh/@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';

// Extended regular expression to remove quantities, units, preparation words, and common descriptors in English and French.
const noiseRegex = new RegExp(
	[
		// Quantities (e.g., 1, 1.5, 1/2, 50g)
		'\\b\\d+\\/\\d+\\b', // Fractions like 1/2
		'\\b\\d*\\.?\\d+\\s*(g|kg|grammes?|oz|lb|ml|l|cl|cup|tasse|tbsp|c.à.s|càs|c.à.c|cac|tsp|teaspoon|tablespoon|cuillère(?:s)? à soupe|cuillère(?:s)? à café|clove|gousse(?:s)?|pinch|pincée|tranche(?:s)?|morceau(?:x)?)s?\\b', // Numbers with units (EN/FR)
		'\\b\\d+\\b', // Standalone numbers

		// Common preparation words and descriptors (EN/FR)
		'\\b(diced|chopped|minced|sliced|julienned|crushed|ground|peeled|seeded|cored|halved|quartered|freshly|fresh|large|medium|small|optional|for garnish|to taste|finely|roughly|frais|hach[ée]s?|émietté|entier|vert|jaune|rouge|noir|gros|moyen|petit|facultatif|pour la garniture|au goût|de préférence entier|seulement si nécessaire)\\b',

		// French partitive/articles
		"\\b(de|du|des|d'|la|le|les)\\b",

		// Punctuation and parentheticals
		'\\s*\\(.*?\\)', // Text in parentheses
		'[,\\.]' // Commas and periods
	].join('|'),
	'gi'
);

function preprocessIngredient(text: string): string {
	if (!text) return '';

	// Convert to lowercase and ignore everything after the first comma
	let cleanedText = text.toLowerCase().trim().split(',')[0];

	// Remove noise using the regex
	cleanedText = cleanedText.replace(noiseRegex, '');

	// Remove French partitive/articles at the start (again, for edge cases)
	cleanedText = cleanedText.replace(/^(de|du|des|d'|la|le|les)\s+/g, '');

	// Remove trailing/plural 's' for basic French plural normalization
	cleanedText = cleanedText.replace(/\b(\w+)s\b/g, '$1');

	// Trim whitespace from start/end and remove extra spaces in the middle
	cleanedText = cleanedText.trim().replace(/\s+/g, ' ');

	// Remove any lingering leading/trailing punctuation or spaces
	cleanedText = cleanedText.replace(/^[,\.\-\s]+|[,\.\-\s]+$/g, '');

	console.log(`Final cleaned text: ${cleanedText}`);
	return cleanedText;
}

Deno.serve(async (req) => {
	// Handle CORS preflight request
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const { ingredients, lang } = await req.json();
		if (!ingredients || !Array.isArray(ingredients)) {
			throw new Error('Missing "ingredients" array in the request body.');
		}

		const supabaseClient = createClient(
			Deno.env.get('SUPABASE_URL') ?? '',
			Deno.env.get('SUPABASE_ANON_KEY') ?? '',
			{ global: { headers: { Authorization: req.headers.get('Authorization')! } } }
		);

		// Process all ingredients in parallel
		const matchPromises = ingredients.map(async (originalText: string) => {
			const cleanedText = preprocessIngredient(originalText);

			// If cleaning results in an empty string, don't query the database
			if (!cleanedText) {
				return { original: originalText, bestMatches: [] };
			}

			const { data, error } = await supabaseClient.rpc('match_ingredient', {
				query: cleanedText,
				lang
			});

			if (error) {
				console.error(`Error matching '${cleanedText}':`, error.message);
				return { original: originalText, bestMatches: [] };
			}

			return {
				original: originalText,
				// The function returns an array, we take the first result
				bestMatches: data
			};
		});

		const matches = await Promise.all(matchPromises);

		return new Response(JSON.stringify({ matches }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			status: 200
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			status: 400
		});
	}
});
