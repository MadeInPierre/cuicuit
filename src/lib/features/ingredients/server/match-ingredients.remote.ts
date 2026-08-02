import { getRequestEvent, query } from '$app/server';
import { languageKeySchema } from '$lib/features/user-settings/consts';
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

	// Convert to lowercase and take primary ingredient before comma/parentheses
	let cleaned = text.toLowerCase().split(',')[0].split('(')[0];

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
		const { supabase } = getRequestEvent().locals;

		const matchPromises = ingredientStrings.map(async (originalText: string) => {
			const cleanedText = preprocessIngredient(originalText);

			if (!cleanedText) {
				return { originalText, bestMatches: [], message: 'Empty after cleaning.' };
			}

			const { data, error } = await supabase.rpc('match_ingredient', {
				query_text: cleanedText,
				lang_code: lang || 'fr-FR',
				n_matches: 10
			});

			if (error) {
				return { originalText, bestMatches: [], message: 'An error occured during RPC matching.' };
			}

			return {
				originalText,
				cleaned: cleanedText,
				bestMatches: data || [],
				message: ''
			};
		});

		const matches = await Promise.all(matchPromises);
		return { matches };
	}
);
