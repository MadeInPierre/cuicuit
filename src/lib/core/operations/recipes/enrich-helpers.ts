// LLM enrichment helpers used by the import ops. Server-only.
import { normalizeRecipeSteps, recipeStepSchema } from '$lib/features/recipes/models/recipe-step';
import { truncateRecipeTitle } from '$lib/features/recipes/modules/recipe-scrape/title';
import { parsedSearchInputSchema } from '$lib/features/recipes/modules/parse-ingredients/parse';
import { sanitizeEnrichedRecipeOutput } from '$lib/features/recipes/modules/recipe-enrich/enrich-recipe';
import { importMetadataSchema, type ImportStepPreview } from './import-events.js';
import { languageCodeSchema } from '$lib/shared/language.js';
import { withLlmStreamFailover } from '$lib/shared/llm/fallback';
import type { LlmCallIdentity } from '$lib/shared/llm/providers';
import type { LlmProvider } from '$lib/shared/llm/providers';
import type { DeepPartial } from 'ai';
import { NoObjectGeneratedError, streamObject } from 'ai';
import z from 'zod';

const RECIPE_ENRICHMENT_SYSTEM_PROMPT = `You are an expert cooking chef and recipe parser. The user will provide you with a draft or incomplete recipe.

# Main task

Your task is to enrich the recipe by inferring missing details (null/incomplete values) and correcting any inconsistencies:
- Restructure, remove, or add steps for clarity. Only improve where necessary, preserving good steps.
	- Steps must only reference ingredients from the main ingredient list.
- Infer cooking times, temperatures, filters, and serving suggestions if missing or incorrect.
- Ensure filters and criteria align with the recipe title (ground truth):
	- Example: "Brigadeiros" missing "Dessert" course → add it.
	- Example: "Pancakes" with "Greek" cuisine but obviously American → change to "American".
- ALL filters must have at least one value and be correct.

# Ingredients

General rules:
- If an ingredient string describes multiple ingredients, split it into multiple ingredients with correct details.
- If ingredients have no or unclear quantities, always suggest realistic quantities, leave no quantities unset.
- Make sure the ingredientName is as simple and short as possible, just as it may appear in a search index.
- Set spices (e.g. salt, pepper) and other flavor-enhancing-only ingredients as optional.
- Do not add ingredients or details not in the original recipe.

Each ingredient has three names:
- ingredientName: the name in the original recipe language.
- ingredientNameEn: the same ingredient translated to English.
- ingredientNameEnGeneral: a more general/common English name for the same ingredient, must be easy to find in an ingredient database (e.g. "chicken breast" -> "chicken", "cèpe" -> "mushroom").

The output expects ingredients at two places:
1. The main ingredients list (the main recipe ingredients) with inferred total quantities and units.
2. One ingredient list per step, with the quantity used in that step (or null if not measurable). The step ingredient list must reference the main ingredients list exactly (ingredientName must match).

The main ingredient quantities must be the sum of all quantities set in steps for that ingredient.

# Steps

You MUST output at least one step in the steps field. Never return an empty array; if the source has no explicit steps, reconstruct sensible steps yourself.

For each step (write at least one), also return structured hints:
- ingredients: list every ingredient used in that step, following the above rules. Only set ingredients explicitely mentioned in the step, do not remind ingredients from previous steps. Fields per ingredient:
	- stepSubstring: the exact substring of the step text that mentions this ingredient, copied verbatim so it can be highlighted. Only the ingredient name itself, not text around it.
	- ingredientName: must match an ingredientName value from the main ingredients list.
	- quantity: the quantity used in that step. Only use null if the quantity is really  not measurable (e.g. "to taste").
- timer_minutes: number of minutes if the step mentions a time, otherwise null.
- temperature_amount: the temperature number if the step mentions a temperature, otherwise null.
- temperature_unit: "C" or "F" matching what the step says, otherwise null.

# Languages

- Detect the recipe's language and output its BCP47 code in the lang field (e.g. "en-US", "fr-FR", "uk-UA").
- Keep all recipe text fields (title, description, steps, notes) in the original recipe language.
- Ingredient names follow the three-field rule above: original language, English, and general English.

# Output requirements

- Return enriched/corrected recipe in JSON format, strictly following the schema, with the top-level fields in this exact order: lang, image, recipe (metadata without steps), ingredients, steps.
- Only improve what needs improvement; preserve good existing information.
- NO FIELD SHALL BE NULL OR EMPTY (except steps details); infer or guess reasonable values.
- RESPOND ONLY WITH RAW JSON. STRICTLY FOLLOW THE SCHEMA. NO EXTRA TEXT.`;

// The steps schema is appended to the shared metadata schema below.
const recipeStepsSchema = z
	.array(recipeStepSchema)
	.min(1, 'Recipe must have at least one step.')
	.catch([])
	.describe('The ordered recipe instructions.');

const streamOutputSchema = z.object({
	lang: languageCodeSchema.catch('en-US'),
	image: z
		.string()
		.nullable()
		.catch(null)
		.describe('The primary image URL, or null if none found.'),
	recipe: importMetadataSchema.describe(
		'The main enriched recipe metadata with inferred details.'
	),
	ingredients: z
		.array(parsedSearchInputSchema)
		.catch([])
		.describe(
			'The list of ingredients. Each quantity is the total amount needed for the whole recipe.'
		),
	steps: recipeStepsSchema
});

export type EnrichedRecipeOutput = z.infer<typeof streamOutputSchema>;

export type EnrichedRecipeResult = {
	output: EnrichedRecipeOutput;
	stats: {
		provider: string;
		fallbackUsed: boolean;
		inputTokens: number | null;
		outputTokens: number | null;
	};
};

/** One chunky section of the streamed enrichment, in generation order. */
export type EnrichSectionPatch =
	| { section: 'metadata'; lang: string | null; metadata: z.infer<typeof importMetadataSchema> }
	| { section: 'ingredients'; ingredients: EnrichedRecipeOutput['ingredients'] }
	| { section: 'steps'; steps: ImportStepPreview[] };

type EnrichStreamChunk =
	| { partial: DeepPartial<z.infer<typeof streamOutputSchema>> }
	| { final: { output: EnrichedRecipeOutput; usage: EnrichUsage | null } };

type EnrichUsage = { inputTokens?: number; outputTokens?: number } | null;

/** Input validation for the enrichment helpers. */
export const enrichRawRecipeInput = z.object({
	content: z.string().min(1).max(200_000, 'Scraped content too long, refusing to call enrich LLM.'),
	format: z.enum(['ldjson', 'recipe-json', 'markdown'])
});

export const enrichTextRecipeInput = z.object({
	text: z.string().min(3).max(20_000, 'Recipe input text too long, refusing to call enrich LLM.')
});

/* ------------- PUBLIC --------------- */

/**
 * Parses raw scraped content (JSON-LD, recipe JSON, or cleaned Markdown) into a
 * structured, enriched recipe using the LLM. The scraping pipeline passes the
 * raw content through as-is; this is where all parsing into the app schema
 * happens. Non-streaming convenience wrapper over `enrichRecipeLlmStream`.
 */
export async function enrichRawRecipe(
	input: z.infer<typeof enrichRawRecipeInput>,
	distinctId?: string
): Promise<EnrichedRecipeResult> {
	const { content, format } = enrichRawRecipeInput.parse(input);
	return drainEnrichStream(
		enrichRecipeLlmStream({ source_format: format, raw_content: content }, distinctId)
	);
}

/**
 * Takes a free-form recipe text as input and enriches it into a structure DB object.
 * Infers missing details, filters, optional ingredients, etc.
 * Uses a remote LLM.
 *
 * @param text - ny free-form text that should include title, ingredients and steps.
 * @returns A promise that resolves to the enriched recipe.
 */
export async function enrichTextRecipe(
	input: z.infer<typeof enrichTextRecipeInput>,
	distinctId?: string
): Promise<EnrichedRecipeResult> {
	const parsed = enrichTextRecipeInput.parse(input);
	return drainEnrichStream(enrichRecipeLlmStream(parsed, distinctId));
}

/** Awaits the section generator's return value (the final enriched result). */
async function drainEnrichStream(
	generator: AsyncGenerator<EnrichSectionPatch, EnrichedRecipeResult, unknown>
): Promise<EnrichedRecipeResult> {
	let next = await generator.next();
	while (!next.done) next = await generator.next();
	return next.value;
}

/* ------------- PRIVATE --------------- */

/**
 * Streams one enrichment through a single LLM completion, yielding chunky
 * section patches (metadata -> ingredients -> steps) as they are generated and
 * returning the composed, sanitized final result. Failover only retries the
 * next provider before the first token; after that the stream is committed.
 */
export async function* enrichRecipeLlmStream(
	recipeInput: object,
	distinctId?: string
): AsyncGenerator<EnrichSectionPatch, EnrichedRecipeResult, unknown> {
	const inputSize = JSON.stringify(recipeInput).length;
	console.log(`[llm] Enriching recipe (${inputSize} bytes input, streaming).`);

	// PostHog: One enrichment call is one turn; there's no multi-turn conversation here, so the
	// same id groups it as both the PostHog trace and session.
	const traceId = crypto.randomUUID();
	const identity: LlmCallIdentity = { traceId, sessionId: traceId, distinctId };

	const { provider, fallbackUsed, stream } = await withLlmStreamFailover(
		(p) => enrichRecipeWithProviderStream(p, recipeInput),
		identity
	);

	const metadataKeys = Object.keys(importMetadataSchema.shape);
	let metadataSent = false;
	let ingredientsSent = false;

	for await (const chunk of stream) {
		if ('partial' in chunk) {
			const partial = chunk.partial;
			const partialRecipe = partial.recipe as Record<string, unknown> | undefined;
			if (
				!metadataSent &&
				partialRecipe &&
				metadataKeys.every((key) => partialRecipe[key] !== undefined)
			) {
				const parsed = importMetadataSchema.safeParse(partialRecipe);
				if (parsed.success) {
					metadataSent = true;
					yield {
						section: 'metadata',
						lang: typeof partial.lang === 'string' ? partial.lang : null,
						metadata: { ...parsed.data, title: truncateRecipeTitle(parsed.data.title) }
					};
				}
			}
			// The schema orders ingredients before steps, so the first `steps`
			// token means the ingredients section just completed.
			if (!ingredientsSent && partial.steps !== undefined) {
				ingredientsSent = true;
				const parsedIngredients = await parsePartialIngredients(partial.ingredients);
				yield { section: 'ingredients', ingredients: parsedIngredients };
			}
		} else {
			const output = chunk.final.output;
			// Defensive: a stream that ended without streaming the steps section.
			if (!ingredientsSent) {
				ingredientsSent = true;
				yield { section: 'ingredients', ingredients: output.ingredients };
			}
			yield { section: 'steps', steps: toStepPreviews(output.steps) };

			console.log(
				`[llm] Recipe enriched by ${provider}${fallbackUsed ? ' (after failover)' : ''}: lang="${output.lang}", title="${output.recipe.title ?? ''}", ${output.ingredients?.length ?? 0} ingredients.`
			);
			return {
				output: sanitizeEnrichedRecipeOutput(output satisfies EnrichedRecipeOutput),
				stats: {
					provider,
					fallbackUsed,
					inputTokens: chunk.final.usage?.inputTokens ?? null,
					outputTokens: chunk.final.usage?.outputTokens ?? null
				}
			};
		}
	}

	throw new Error('LLM stream ended without a final object.');
}

/** Validates a streamed ingredients array element-wise, keeping the parseable ones. */
function parsePartialIngredients(partial: unknown): EnrichedRecipeOutput['ingredients'] {
	if (!Array.isArray(partial)) return [];
	return partial
		.map((item) => parsedSearchInputSchema.safeParse(item))
		.filter((r) => r.success)
		.map((r) => r.data);
}

/** Maps sanitized steps to the client-safe preview shape (text + timer only). */
function toStepPreviews(steps: EnrichedRecipeOutput['steps']): ImportStepPreview[] {
	return steps.map((step) => ({
		text: step.text,
		timer_minutes: step.timer_minutes,
		temperature_amount: step.temperature_amount,
		temperature_unit:
			step.temperature_unit === 'C' || step.temperature_unit === 'F' ? step.temperature_unit : null
	}));
}

function enrichRecipeWithProviderStream(
	provider: LlmProvider,
	recipeInput: object
): AsyncGenerator<EnrichStreamChunk> {
	const result = streamObject({
		model: provider.model,
		schema: streamOutputSchema,
		schemaDescription: 'The same recipe as received, but enriched and/or corrected.',
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

	return enrichProviderChunks(provider, result);
}

async function* enrichProviderChunks(
	provider: LlmProvider,
	result: {
		partialObjectStream: AsyncIterable<unknown>;
		object: Promise<z.infer<typeof streamOutputSchema>>;
		usage: Promise<EnrichUsage>;
	}
): AsyncGenerator<EnrichStreamChunk> {
	try {
		for await (const partial of result.partialObjectStream) {
			yield { partial: partial as DeepPartial<z.infer<typeof streamOutputSchema>> };
		}
		const final = await result.object;
		const usage = await result.usage.catch(() => null);
		yield { final: { output: final, usage } };
	} catch (error) {
		if (error instanceof NoObjectGeneratedError) {
			console.error('LLM call failed due to:', error);
			console.error(`${provider.id}: no object generated, malformed LLM output:`, error.text);

			// Attempt to repair the malformed JSON
			if (error.text) {
				const repaired = repairLlmOutput(error.text);
				if (repaired) {
					console.log(`[llm] ${provider.id}: malformed output repaired successfully.`);
					const usage = await result.usage.catch(() => null);
					yield { final: { output: repaired, usage } };
					return;
				}
			}
		} else {
			console.error(`[llm] Unexpected error during recipe enrichment with ${provider.id}:`, error);
		}

		throw error;
	}
}

function repairLlmOutput(llmOutputText: string): EnrichedRecipeOutput | null {
	// Attempt to parse the malformed output as JSON
	try {
		console.log('Attempting to repair malformed LLM output...');
		const parsed = JSON.parse(llmOutputText) as Record<string, unknown>;

		// Validate and coerce the parsed data to match the schema as much as possible
		const partialResult = streamOutputSchema.safeParse(parsed);

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
			const recipeResult = importMetadataSchema.safeParse(parsed.recipe);
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
							importMetadataSchema.shape[key as keyof typeof importMetadataSchema.shape];
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
				const partialRecipeResult = importMetadataSchema.partial().safeParse(partialRecipe);
				if (partialRecipeResult.success) {
					console.log('Successfully parsed partial recipe');
					recovered.recipe = partialRecipeResult.data as z.infer<typeof importMetadataSchema>;
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
				if (result.success && result.data.ingredientName?.trim()) {
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
						if (
							partialResult.success &&
							Object.keys(partialIngredient).length > 0 &&
							partialResult.data.ingredientName?.trim()
						) {
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

		// Recover the steps if present
		if (parsed && typeof parsed === 'object' && 'steps' in parsed) {
			const recoveredSteps = normalizeRecipeSteps(parsed.steps);
			if (recoveredSteps.length > 0) {
				recovered.steps = recoveredSteps;
				console.log(`Recovered ${recoveredSteps.length} steps`);
			}
		}

		// Recover the image URL if present
		if (parsed && typeof parsed === 'object' && 'image' in parsed) {
			const imageResult = streamOutputSchema.shape.image.safeParse(parsed.image);
			if (imageResult.success) {
				recovered.image = imageResult.data;
				console.log(`Recovered image: ${recovered.image}`);
			} else {
				console.warn('Failed to recover image:', imageResult.error);
			}
		}

		// Recover the language if present
		if (parsed.lang && typeof parsed.lang === 'string') {
			const langResult = languageCodeSchema.safeParse(parsed.lang);
			if (langResult.success) {
				recovered.lang = langResult.data;
				console.log(`Recovered language: ${recovered.lang}`);
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
