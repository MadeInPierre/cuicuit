import { modelMistral } from '$lib/shared/llm/mistral';
import type { MistralLanguageModelOptions } from '@ai-sdk/mistral';
import { generateText, NoObjectGeneratedError, Output } from 'ai';
import { publicRecipesRowSchema } from '$lib/shared/db/supazod.schemas';
import { query } from '$app/server';
import { parsedSearchInputSchema } from './parse-ingredients/parse';
import z from 'zod';

const RECIPE_ENRICHMENT_SYSTEM_PROMPT = `You are an expert cooking chef and recipe developer.
The user will provide you with a draft or incomplete recipe.

Your task is to enrich the recipe by inferring missing details (null/incomplete values) and correcting any inconsistencies:
- Restructure, remove, or add steps for clarity. Only improve where necessary, preserving good steps.
	- Steps must strictly reference only ingredients from the provided list.
- Infer cooking times, temperatures, filters, enums, and serving suggestions if missing or incorrect.
- Replace vague, ambiguous, or inconsistent information with precise, accurate details (enums, filters, times, description, steps).
- Update description to match the recipe if vague, unclear, or inconsistent.
- Ensure filters and criteria align with the recipe title (ground truth):
	- Example: "Brigadeiros" missing "Dessert" course → add it.
	- Example: "Pancakes" with "Greek" cuisine but clearly American → change to "American".
	- Note: "prep" course is for small recipes meant to be combined with other dishes (sauces, quick sides). Standalone dishes should not use "prep".
- ALL filters must have at least one value and be correct.

Also provide a cleaned, enriched ingredient list, inferring missing details (quantity, unit, description).
If an ingredient string is actually multiple ingredients combined, split it into multiple ingredients with correct details.
Do not add ingredients or details not in the original recipe.

Requirements:
- Return enriched/corrected recipe in JSON format, strictly following the schema.
- Only improve what needs improvement; preserve good existing information.
- Maintain the same language as input for all text fields.
- NO FIELD SHALL BE NULL OR EMPTY; infer reasonable defaults if needed.
- RESPOND ONLY WITH RAW JSON. STRICTLY FOLLOW THE SCHEMA. NO EXTRA TEXT.`;

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
