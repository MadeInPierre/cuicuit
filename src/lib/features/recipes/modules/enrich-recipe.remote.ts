import { modelMistral } from '$lib/shared/llm/mistral';
import type { MistralLanguageModelOptions } from '@ai-sdk/mistral';
import { generateText, Output } from 'ai';
import { publicRecipesRowSchema } from '$lib/shared/db/supazod.schemas';
import { query } from '$app/server';
import { parsedSearchInputSchema } from './parse-ingredients/parse';
import z from 'zod';

const RECIPE_ENRICHMENT_SYSTEM_PROMPT = `You are an expert cooking chef and recipe developer.
The user will provide you with a draft or incomplete recipe.

Your task is to enrich the recipe by inferring any missing details (null or incomplete values), such as:
- Restructuring, removing, or adding steps to the list of steps for clarity.
    - Do not change steps that are already good as-is, only improve where necessary.
    - Make sure the steps strictly follow the list of ingredients, and do not reference any ingredients that are not in the list.
- Inferring cooking times, temperatures, filters criteria, enums, and serving suggestions if not provided or probably incorrect.
- Changing any vague, ambiguous, or probably incorrect/inconsistent information to be more precise and accurate (e.g. enums, filters, times, description, steps, etc).
- Changing the description to better match the recipe if it's vague, unclear, or inconsistent.
- Changing the filters and criteria to fit with the recipe title, which is always the ground truth. 
    - For instance, if a recipe "Brigadeiros" is missing the "Dessert" course filter, add it.
    - Another example: if a recipe "Pancakes" has the "Greek" cuisine filter, but the recipe is clearly American pancakes from your knowledge, change it to "American".
- Ensuring the overall recipe is clear, concise, and easy to follow.
- MAKE SURE THE FILTERS HAVE AT LEAST ONE VALUE EACH, AND ARE CORRECT.

Also, you will provide a cleaned and enriched list of ingredients used in the recipe, inferring any missing details such as quantity, unit, description, etc.
Do not invent any ingredients or details that are not present in the original recipe, just clean and enrich what is already there.

Return the enriched and/or corrected recipe in JSON format, adhering strictly to the provided schema.
Do not change any recipe information that is already provided and seems good as-is, but make sure to improve it where necessary.
Enrich the recipe with the same language as the input recipe for all text-based fields.
NO FIELD SHALL BE LEFT NULL OR EMPTY, INFER REASONABLE DEFAULTS IF NECESSARY.
RESPOND ONLY WITH THE RAW JSON AND STRICTLY FOLLOW THE SCHEMA, DO NOT ADD ANY EXTRA TEXT OR EXPLANATIONS.`;

const schema = z.object({
	recipe: publicRecipesRowSchema.describe('The main enriched recipe object with inferred details.'),
	ingredients: z
		.array(parsedSearchInputSchema)
		.describe(
			'The list of ingredients used in the recipe, cleaned and enriched with inferred details.'
		)
});

export type EnrichedRecipeOutput = z.infer<typeof schema>;

/**
 * Takes a draft or incomplete recipe and enriches it to infer missing details, filters, optional ingredients, etc.
 * Uses a remote LLM.
 *
 * @param recipe - The incomplete recipe to enrich.
 * @returns A promise that resolves to the enriched recipe.
 */
export const enrichRecipe = query(
	z.object({
		recipe: publicRecipesRowSchema.describe('The main recipe object to enrich.'),
		ingredients: z
			.array(z.string())
			.describe('The list of ingredient strings used in the recipe, as raw parsed from the source.')
	}),
	async (input) => {
		const response = await generateText({
			model: modelMistral,
			output: Output.object({
				schema,
				description: 'The same recipe as received, but enriched and/or corrected.'
			}),
			providerOptions: {
				mistral: {} satisfies MistralLanguageModelOptions
			},
			messages: [
				{
					role: 'system',
					content: RECIPE_ENRICHMENT_SYSTEM_PROMPT
				},
				{
					role: 'user',
					content: JSON.stringify(input, null, 2)
				}
			],
			temperature: 0
		});

		console.log('Response from Mistral model:', response);

		return response.output satisfies EnrichedRecipeOutput;
	}
);
