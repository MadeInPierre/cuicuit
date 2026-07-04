import { query } from '$app/server';
import { languageKeySchema } from '$lib/features/user-settings/consts';
import { supabase } from '$lib/shared/db/supabase-client.svelte';
import z from 'zod';

// We only remove numbers, fractions, units, and action verbs.
// We DO NOT remove adjectives (rouge, frais, gros) because they differentiate ingredients.
const noiseRegex = new RegExp(
	[
		'\\b\\d+\\/\\d+\\b', // Fractions
		'\\b\\d*\\.?\\d+\\s*(g|kg|grammes?|oz|lb|ml|l|cl|cup|tasses?|tbsp|c\\.à\\.s|càs|c\\.à\\.c|cac|tsp|teaspoons?|tablespoons?|cuillères? à soupe|cuillères? à café|cloves?|gousses?|pinch|pincées?|tranches?|morceaux?)\\b',
		'\\b\\d+\\b', // Standalone numbers
		'\\b(diced|chopped|minced|sliced|julienned|crushed|peeled|seeded|cored|halved|quartered|optional|for garnish|to taste|finely|roughly|hach[ée]s?|émietté|facultatif|pour la garniture|au goût)\\b'
	].join('|'),
	'gi'
);

function preprocessIngredient(text: string): string {
	if (!text) return '';

	// Convert to lowercase and take primary ingredient before comma
	let cleaned = text.toLowerCase().split(',')[0];

	// Strip mathematical/action noise
	cleaned = cleaned.replace(noiseRegex, ' ');

	// Safely remove leading articles without destroying internal words
	cleaned = cleaned.replace(/^(de |du |des |d'|la |le |les |un |une )/i, '');

	// We will let PostgreSQL handle plurals via its language dictionaries. No naive 's' removal here.

	// Cleanup spacing and punctuation
	return cleaned.replace(/[,\.\-\s]+/g, ' ').trim();
}

export const matchIngredientsRPC = query(
	z.object({
		ingredientStrings: z.array(z.string()).min(1),
		lang: languageKeySchema
	}),
	async ({ ingredientStrings, lang }) => {
		const matchPromises = ingredientStrings.map(async (originalText: string) => {
			if (!supabase.client) throw new Error('No supabase client');

			const cleanedText = preprocessIngredient(originalText);

			if (!cleanedText) {
				return { originalText, bestMatches: [], message: 'Empty after cleaning.' };
			}

			const { data, error } = await supabase.client.rpc('match_ingredient', {
				query_text: cleanedText, // Renamed to avoid SQL reserved word conflicts
				lang_code: lang || 'fr-FR',
				n_matches: 10
			});

			if (error) throw error;

			return {
				originalText,
				cleaned: cleanedText, // Good for debugging in your frontend
				bestMatches: data || [],
                message: ''
			};
		});

		const matches = await Promise.all(matchPromises);
		return { matches };
	}
);
