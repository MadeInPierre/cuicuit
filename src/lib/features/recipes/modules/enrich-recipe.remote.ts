import { modelMistral } from '$lib/shared/llm/mistral';
import type { MistralLanguageModelOptions } from '@ai-sdk/mistral';
import { generateText, NoObjectGeneratedError, Output } from 'ai';
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
Do not add any ingredients or details that are not present in the original recipe, just clean and parse what is already there.

Return the enriched and/or corrected recipe in JSON format, adhering strictly to the provided schema.
Do not change any recipe information that is already provided and seems good as-is, but make sure to improve it where necessary.
Enrich the recipe with the same language as the input recipe for all text-based fields.
NO FIELD SHALL BE LEFT NULL OR EMPTY, INFER REASONABLE DEFAULTS IF NECESSARY.
RESPOND ONLY WITH THE RAW JSON AND STRICTLY FOLLOW THE SCHEMA, DO NOT ADD ANY EXTRA TEXT OR EXPLANATIONS.`;

// Define the relevant recipe fields for enrichment once
const relevantRecipeFieldsSchema = z.object({
	title: publicRecipesRowSchema.shape.title,
	description: publicRecipesRowSchema.shape.description,
	servings: publicRecipesRowSchema.shape.servings,
	time_prep_minutes: publicRecipesRowSchema.shape.time_prep_minutes,
	time_cook_minutes: publicRecipesRowSchema.shape.time_cook_minutes,
	time_rest_minutes: publicRecipesRowSchema.shape.time_rest_minutes,
	cleanup_level: publicRecipesRowSchema.shape.cleanup_level,
	cost_level: publicRecipesRowSchema.shape.cost_level,
	skill_level: publicRecipesRowSchema.shape.skill_level,
	effort_level: publicRecipesRowSchema.shape.effort_level,
	courses: publicRecipesRowSchema.shape.courses,
	cuisines: publicRecipesRowSchema.shape.cuisines,
	times_of_day: publicRecipesRowSchema.shape.times_of_day,
	tools: publicRecipesRowSchema.shape.tools,
	steps: publicRecipesRowSchema.shape.steps,
	notes: publicRecipesRowSchema.shape.notes
}) satisfies z.ZodType<Partial<z.infer<typeof publicRecipesRowSchema>>>;

const outputSchema = z.object({
	recipe: relevantRecipeFieldsSchema.describe(
		'The main enriched recipe object with inferred details.'
	),
	ingredients: z
		.array(parsedSearchInputSchema)
		.describe(
			'The list of ingredients used in the recipe, cleaned and enriched with inferred details.'
		)
});

export type EnrichedRecipeOutput = z.infer<typeof outputSchema>;

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
		// Extract only the relevant fields using the schema
		const relevantInput = {
			recipe: relevantRecipeFieldsSchema.parse(input.recipe),
			ingredients: input.ingredients
		};

		// Call the LLM to enrich the recipe
		try {
			const response = await generateText({
				model: modelMistral,
				output: Output.object({
					schema: outputSchema,
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
						content: JSON.stringify(relevantInput, null, 2)
					}
				],
				temperature: 0
			});

			console.log('Response from Mistral model:', response);
			return response.output satisfies EnrichedRecipeOutput;
		} catch (error) {
			if (error instanceof NoObjectGeneratedError) {
				console.error('No object generated error, malformed LLM output:', error.text);

				// Attempt to repair the malformed JSON
				if (!error.text) throw error;
				const repaired = repairLlmOutput(error.text);
				if (repaired) return repaired;
			} else {
				console.error('Unexpected error during recipe enrichment:', error);
			}

			throw error;
		}
	}
);

// LLM-generated
function repairLlmOutput(llmOutputText: string): EnrichedRecipeOutput | null {
	// Attempt to parse the malformed output as JSON
	try {
		console.log('Attempting to repair malformed LLM output...');
		const parsed = JSON.parse(llmOutputText);

		// Validate and coerce the parsed data to match the schema as much as possible
		const partialResult = outputSchema.safeParse(parsed);

		if (partialResult.success) {
			console.log('Successfully recovered valid output from malformed response');
			return partialResult.data;
		}

		// If validation fails, try to extract what we can
		console.warn('Partial parsing failed, attempting field-by-field extraction');
		console.log('Parsed data structure:', JSON.stringify(parsed, null, 2));
		const recovered: Partial<EnrichedRecipeOutput> = {};

		if (parsed.recipe) {
			console.log('Attempting to recover recipe fields...');
			const recipeResult = relevantRecipeFieldsSchema.safeParse(parsed.recipe);
			if (recipeResult.success) {
				console.log('Recipe validated successfully');
				recovered.recipe = recipeResult.data;
			} else {
				// Attempt field-by-field recovery for recipe
				console.warn('Recipe validation failed:', recipeResult.error.errors);
				console.log('Attempting field-by-field recovery for recipe');
				const partialRecipe: Record<string, unknown> = {};

				for (const [key, value] of Object.entries(parsed.recipe)) {
					try {
						// Try to validate individual fields using the schema shape
						const fieldSchema =
							relevantRecipeFieldsSchema.shape[
								key as keyof typeof relevantRecipeFieldsSchema.shape
							];
						if (fieldSchema) {
							const fieldResult = fieldSchema.safeParse(value);
							if (fieldResult.success) {
								partialRecipe[key] = fieldResult.data;
								console.log(`✓ Recovered field: ${key}`);
							} else {
								console.warn(`✗ Failed to recover field: ${key}`, fieldResult.error.errors);
							}
						} else {
							// If no schema for this field, include it as-is
							console.log(`? Unknown field, including as-is: ${key}`);
							partialRecipe[key] = value;
						}
					} catch (err) {
						// Skip invalid fields
						console.error(`Error processing field ${key}:`, err);
						continue;
					}
				}

				console.log('Partially recovered recipe fields:', Object.keys(partialRecipe));

				// Try to parse the partially recovered recipe
				const partialRecipeResult = relevantRecipeFieldsSchema.partial().safeParse(partialRecipe);
				if (partialRecipeResult.success) {
					console.log('Successfully parsed partial recipe');
					recovered.recipe = partialRecipeResult.data as z.infer<typeof relevantRecipeFieldsSchema>;
				} else {
					console.error('Failed to parse partial recipe:', partialRecipeResult.error.errors);
				}
			}
		}

		if (parsed.ingredients && Array.isArray(parsed.ingredients)) {
			console.log(`Attempting to recover ${parsed.ingredients.length} ingredients...`);
			const recoveredIngredients: z.infer<typeof parsedSearchInputSchema>[] = [];

			for (const ing of parsed.ingredients) {
				const result = parsedSearchInputSchema.safeParse(ing);
				if (result.success) {
					recoveredIngredients.push(result.data);
					console.log(`✓ Recovered ingredient:`, result.data);
				} else {
					// Attempt field-by-field recovery for ingredient
					console.warn(
						'Ingredient validation failed, attempting field-by-field recovery:',
						result.error.errors
					);
					const partialIngredient: Record<string, unknown> = {};

					if (ing && typeof ing === 'object') {
						for (const [key, value] of Object.entries(ing)) {
							try {
								const fieldSchema =
									parsedSearchInputSchema.shape[key as keyof typeof parsedSearchInputSchema.shape];
								if (fieldSchema) {
									const fieldResult = fieldSchema.safeParse(value);
									if (fieldResult.success) {
										partialIngredient[key] = fieldResult.data;
										console.log(`  ✓ Recovered ingredient field: ${key}`);
									} else {
										console.warn(`  ✗ Failed to recover ingredient field: ${key}`);
									}
								}
							} catch (err) {
								console.error(`  Error processing ingredient field ${key}:`, err);
								continue;
							}
						}

						// Try to parse the partially recovered ingredient
						const partialResult = parsedSearchInputSchema.partial().safeParse(partialIngredient);
						if (partialResult.success && Object.keys(partialIngredient).length > 0) {
							console.log(
								`  ✓ Partially recovered ingredient with ${Object.keys(partialIngredient).length} fields`
							);
							recoveredIngredients.push(
								partialResult.data as z.infer<typeof parsedSearchInputSchema>
							);
						}
					}
				}
			}

			if (recoveredIngredients.length > 0) {
				console.log(
					`✓ Recovered ${recoveredIngredients.length} valid ingredients (full or partial)`
				);
				recovered.ingredients = recoveredIngredients;
			}
		}

		// If we recovered some valid data, return it
		if (recovered.recipe || recovered.ingredients) {
			console.log('Final recovered data:', {
				hasRecipe: !!recovered.recipe,
				ingredientsCount: recovered.ingredients?.length ?? 0
			});
			return recovered as EnrichedRecipeOutput;
		}
	} catch (parseError) {
		console.error('Failed to parse malformed output as JSON:', parseError);
	}
	return null;
}
