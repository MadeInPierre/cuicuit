import type { Database } from '$lib/shared/db/supabase.types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { RecipeIngredientWithTranslations } from '../../queries/get-recipe-detailed';
import { matchIngredients } from './match';
import { parsedSearchInputSchema, parseIngredientString } from './parse';

export const ingredientProcessedSchema = z.object({
	sourceText: z.string(),
	parsed: parsedSearchInputSchema,
	matches: z.array(z.custom<RecipeIngredientWithTranslations>())
});

export type IngredientProcessed = z.infer<typeof ingredientProcessedSchema>;

export async function processIngredientStrings(
	supabase: SupabaseClient<Database>,
	input: string[],
	lang: string = 'en-US'
): Promise<IngredientProcessed[]> {
	// Filter out empty or whitespace-only strings
	const eligibleStrings = input.map((s) => s.trim()).filter((s) => s.length > 0);

	// Separate the quantity, unit, ingredient name, and details from each input string
	const parsed = eligibleStrings.map(parseIngredientString);

	// Match the parsed ingredient names against the ingredient database
	const { data: matchData, error: matchError } = await matchIngredients(
		supabase,
		parsed.map((p, i) => p.ingredientText || eligibleStrings[i]),
		lang
	);

	if (matchError) console.warn('Error matching ingredients:', matchError);

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
	supabase: SupabaseClient<Database>,
	input: string,
	lang: string = 'en-US'
): Promise<IngredientProcessed> {
	return processIngredientStrings(supabase, [input], lang).then((results) => results[0]);
}
