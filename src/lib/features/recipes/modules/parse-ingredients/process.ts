import { matchIngredients, type IngredientMatch } from './match';
import { parseIngredientString, type ParsedSearchInput } from './parse';
import { z } from 'zod';

export const ingredientProcessedSchema = z.object({
	sourceText: z.string(),
	parsed: z.custom<ParsedSearchInput>(),
	matches: z.array(z.custom<IngredientMatch>())
});

export type IngredientProcessed = z.infer<typeof ingredientProcessedSchema>;

export async function processIngredientStrings(
	input: string[],
	lang: string = 'en-US'
): Promise<IngredientProcessed[]> {
	// Filter out empty or whitespace-only strings
	const eligibleStrings = input.map((s) => s.trim()).filter((s) => s.length > 0);

	// Separate the quantity, unit, ingredient name, and details from each input string
	const parsed = eligibleStrings.map(parseIngredientString);

	// Match the parsed ingredient names against the ingredient database
	const { data: matchData, error: matchError } = await matchIngredients(
		parsed.map((p, i) => p.ingredientText || eligibleStrings[i]),
		lang
	);

	if (matchError) console.warn('Error matching ingredients:', matchError);
	console.log('Match data received for ingredients:', matchData);

	// Combine results into a final structured ingredient object
	return eligibleStrings.map(
		(sourceText, i) =>
			({
				sourceText,
				parsed: parsed[i],
				matches: matchData?.matches[i].bestMatches || []
			}) satisfies IngredientProcessed
	);
}

export function processIngredientString(
	input: string,
	lang: string = 'en-US'
): Promise<IngredientProcessed> {
	return processIngredientStrings([input], lang).then((results) => results[0]);
}
