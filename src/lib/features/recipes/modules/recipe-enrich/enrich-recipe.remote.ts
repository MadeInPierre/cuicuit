import { getRequestEvent, query } from '$app/server';
import { languageKeySchema } from '$lib/features/user-settings/consts';
import { publicRecipesRowSchema } from '$lib/shared/db/supazod.schemas';
import { withLlmFailover } from '$lib/shared/llm/fallback';
import type { LlmProvider } from '$lib/shared/llm/providers';
import { generateText, NoObjectGeneratedError, Output } from 'ai';
import z from 'zod';
import { parsedSearchInputSchema } from '../parse-ingredients/parse';

const RECIPE_ENRICHMENT_SYSTEM_PROMPT = `You are an expert cooking chef and recipe parser. The user will provide you with a draft or incomplete recipe.

Your task is to enrich the recipe by inferring missing details (null/incomplete values) and correcting any inconsistencies:
- Restructure, remove, or add steps for clarity. Only improve where necessary, preserving good steps.
	- Steps must strictly reference only ingredients from the ingredient list.
- Infer cooking times, temperatures, filters, enums, and serving suggestions if missing or incorrect.
- Replace vague, ambiguous, or inconsistent information with precise, accurate details (enums, filters, times, description, steps).
- Update description to match the recipe if vague, unclear, or inconsistent.
- Ensure filters and criteria align with the recipe title (ground truth):
	- Example: "Brigadeiros" missing "Dessert" course → add it.
	- Example: "Pancakes" with "Greek" cuisine but clearly American → change to "American".
	- Note: "prep" course is for small recipes meant to be combined with other dishes (sauces, quick sides). Standalone dishes should not use "prep".
- ALL filters must have at least one value and be correct.
- If ingredients have no or unclear quantities, suggest realistic quantities.
- Set spices, salt, pepper, and other not-so-important ingredients as optional.

Also provide a cleaned, enriched ingredient list, inferring missing details (quantity, unit, description).
If an ingredient string is actually describing multiple ingredients, split it into multiple ingredients with correct details.
Do not add ingredients or details not in the original recipe.

Requirements:
- Return enriched/corrected recipe in JSON format, strictly following the schema.
- Only improve what needs improvement; preserve good existing information.
- Maintain the same language as input for all text fields.
- NO FIELD SHALL BE NULL OR EMPTY; infer or guess reasonable values.
- RESPOND ONLY WITH RAW JSON. STRICTLY FOLLOW THE SCHEMA. NO EXTRA TEXT.`;

// Define the relevant recipe fields for enrichment once
const relevantRecipeFieldsSchema = z.object({
	title: publicRecipesRowSchema.shape.title.describe(
		'Original title, but without useless SEO text, e.g. "the best".'
	),
	short_title: publicRecipesRowSchema.shape.short_title.describe(
		'Shortest possible title for this recipe in 1 word.'
	),
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
	lang: languageKeySchema.describe(
		"The input recipe's written language, e.g. en-US, fr-FR, pt-BR, es-ES."
	),
	recipe: relevantRecipeFieldsSchema.describe(
		'The main enriched recipe object with inferred details.'
	),
	ingredients: z
		.array(parsedSearchInputSchema)
		.describe('The list of ingredients, cleaned and enriched with inferred details.')
});

export type EnrichedRecipeOutput = z.infer<typeof outputSchema>;

export type EnrichedRecipeResult = {
	output: EnrichedRecipeOutput;
	stats: {
		provider: string;
		fallbackUsed: boolean;
		inputTokens: number | null;
		outputTokens: number | null;
	};
};

/* ------------- PUBLIC --------------- */

/**
 * Parses raw scraped content (JSON-LD, recipe JSON, or cleaned Markdown) into a
 * structured, enriched recipe using the LLM. The scraping pipeline passes the
 * raw content through as-is; this is where all parsing into the app schema
 * happens.
 */
export const enrichRawRecipe = query(
	z.object({
		content: z
			.string()
			.min(1)
			.max(200_000, 'Scraped content too long, refusing to call enrich LLM.'),
		format: z.enum(['ldjson', 'recipe-json', 'markdown'])
	}),
	async ({ content, format }) => {
		return enrichRecipeLlm({
			source_format: format,
			raw_content: content
		});
	}
);

/**
 * Takes a free-form recipe text as input and enriches it into a structure DB object.
 * Infers missing details, filters, optional ingredients, etc.
 * Uses a remote LLM.
 *
 * @param text - ny free-form text that should include title, ingredients and steps.
 * @returns A promise that resolves to the enriched recipe.
 */
export const enrichTextRecipe = query(
	z.object({
		text: z.string().min(3).max(20_000, 'Recipe input text too long, refusing to call enrich LLM.')
	}),
	async (input) => {
		return enrichRecipeLlm(input);
	}
);

/* ------------- PRIVATE --------------- */

async function enrichRecipeLlm(recipeInput: object): Promise<EnrichedRecipeResult> {
	const inputSize = JSON.stringify(recipeInput).length;
	console.log(`[llm] Enriching recipe (${inputSize} bytes input).`);

	// PostHog: One enrichment call is one turn; there's no multi-turn conversation here, so the
	// same id groups it as both the PostHog trace and session.
	const traceId = crypto.randomUUID();
	const identity = { traceId, sessionId: traceId, distinctId: await getOptionalDistinctId() };

	// Call the LLM to enrich the recipe, failing over across providers in priority order.
	return withLlmFailover(
		(provider) => enrichRecipeWithProvider(provider, recipeInput),
		identity
	).then(({ provider, fallbackUsed, value }) => {
		console.log(
			`[llm] Recipe enriched by ${provider}${fallbackUsed ? ' (after failover)' : ''}: lang="${value.output.lang}", title="${value.output.recipe.title ?? ''}", ${value.output.ingredients?.length ?? 0} ingredients.`,
			JSON.stringify(value.output)
		);
		return {
			output: value.output satisfies EnrichedRecipeOutput,
			stats: {
				provider,
				fallbackUsed,
				inputTokens: value.usage?.inputTokens ?? null,
				outputTokens: value.usage?.outputTokens ?? null
			}
		};
	});
}

/**
 * PostHog: The caller (e.g. `importRecipeFromUrl`) already enforces auth before reaching this
 * module; this only reads the already-authenticated user for PostHog attribution, and
 * never blocks the enrichment if it can't be determined.
 */
async function getOptionalDistinctId(): Promise<string | undefined> {
	try {
		const { data } = await getRequestEvent().locals.supabase.auth.getUser();
		return data.user?.id;
	} catch {
		return undefined;
	}
}

async function enrichRecipeWithProvider(
	provider: LlmProvider,
	recipeInput: object
): Promise<{
	output: EnrichedRecipeOutput;
	usage: { inputTokens: number | undefined; outputTokens: number | undefined } | null;
}> {
	try {
		const response = await generateText({
			model: provider.model,
			output: Output.object({
				schema: outputSchema,
				description: 'The same recipe as received, but enriched and/or corrected.'
			}),
			messages: [
				{
					role: 'system',
					content: RECIPE_ENRICHMENT_SYSTEM_PROMPT
				},
				{
					role: 'user',
					content: JSON.stringify(recipeInput, null, 2)
				}
			],
			temperature: 0
		});

		console.log(
			`[llm] ${provider.id}: ${response.usage?.inputTokens ?? '?'} input, ${response.usage?.outputTokens ?? '?'} output tokens.`
		);
		return {
			output: response.output satisfies EnrichedRecipeOutput,
			usage: response.usage ?? null
		};
	} catch (error) {
		if (error instanceof NoObjectGeneratedError) {
			console.error(`${provider.id}: no object generated, malformed LLM output:`, error.text);

			// Attempt to repair the malformed JSON
			if (error.text) {
				const repaired = repairLlmOutput(error.text);
				if (repaired) {
					console.log(`[llm] ${provider.id}: malformed output repaired successfully.`);
					return { output: repaired, usage: null };
				}
			}
		} else {
			console.error(`[llm] Unexpected error during recipe enrichment with ${provider.id}:`, error);
		}

		throw error;
	}
}

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
								console.warn(`✗ Failed to recover field: ${key}`, fieldResult.error);
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
					console.error('Failed to parse partial recipe:', partialRecipeResult.error);
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
						result.error
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

		// Recover the language if present
		if (parsed.lang && typeof parsed.lang === 'string') {
			const langResult = languageKeySchema.safeParse(parsed.lang);
			recovered.lang = langResult.data;
			console.log(`Recovered language: ${recovered.lang}`);
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
