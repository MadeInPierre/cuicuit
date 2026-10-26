import { ingredientQuantitySchema } from '$lib/shared/utils/quantity';
import { z } from 'zod';

/** The step ingredient shape the LLM produces. */
export const llmStepIngredientSchema = z.object({
	ingredientText: z
		.string()
		.default('')
		.catch('')
		.describe('Must match an ingredientText from the top-level ingredients list.'),
	stepSubstring: z
		.string()
		.default('')
		.catch('')
		.describe(
			'Exact substring of the step text that mentions this ingredient, copied verbatim for highlighting.'
		),
	quantity: ingredientQuantitySchema.nullable().default(null).catch(null)
});

/**
 * The persisted step ingredient in the database. `ingredientId` is the database id,
 * which replaces the LLM's `ingredientText` as it's cleaner to store.
 */
export const stepIngredientSchema = z.object({
	ingredientId: z.string().nullable().default(null),
	stepSubstring: z.string().default(''),
	quantity: ingredientQuantitySchema.nullable().default(null)
});

/** The step shape the LLM must produce (no resolved ids). */
export const recipeStepSchema = z.object({
	text: z.string().default('').catch(''),
	ingredients: z.array(llmStepIngredientSchema).default([]).catch([]),
	timer_minutes: z.coerce.number().nullable().default(null).catch(null),
	temperature_amount: z.coerce.number().nullable().default(null).catch(null),
	temperature_unit: z.string().nullable().default(null).catch(null)
});

/** The step shape stored in `recipes.steps` (with resolved ingredient ids). */
export const storedRecipeStepSchema = recipeStepSchema.extend({
	temperature_unit: z.enum(['C', 'F']).nullable().default(null),
	ingredients: z.array(stepIngredientSchema).default([])
});

export const recipeStepHintsSchema = storedRecipeStepSchema.omit({ text: true });

export type EnrichedStepIngredient = z.infer<typeof llmStepIngredientSchema>;
export type EnrichedRecipeStep = z.infer<typeof recipeStepSchema>;
export type StepIngredient = z.infer<typeof stepIngredientSchema>;
export type RecipeStep = z.infer<typeof storedRecipeStepSchema>;
export type RecipeStepHints = z.infer<typeof recipeStepHintsSchema>;

export const EMPTY_RECIPE_STEP_HINTS: RecipeStepHints = {
	ingredients: [],
	timer_minutes: null,
	temperature_amount: null,
	temperature_unit: null
};

/** Fresh hints object (never share one instance between steps). */
export function emptyRecipeStepHints(): RecipeStepHints {
	return { ...EMPTY_RECIPE_STEP_HINTS, ingredients: [] };
}

// Words that don't help tell two ingredient names apart, removed before comparing.
const NAME_STOPWORDS = new Set([
	'de',
	'du',
	'des',
	'da',
	'la',
	'le',
	'les',
	'un',
	'une',
	'd',
	'l',
	'a',
	'au',
	'aux',
	'ou',
	'et',
	'avec',
	'sans',
	'pour',
	'of',
	'the'
]);

/** Normalizes an ingredient name for comparison (case/accent-insensitive). */
export function normalizeIngredientName(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

function singularize(token: string): string {
	return token.length > 3 && token.endsWith('s') ? token.slice(0, -1) : token;
}

function tokens(value: string): string[] {
	return normalizeIngredientName(value)
		.split(' ')
		.filter((token) => token && !NAME_STOPWORDS.has(token))
		.map(singularize);
}

/**
 * Scores how likely two ingredient names refer to the same thing (0..1).
 * Exact matches win, then substring matches, then token overlap.
 */
export function ingredientNameScore(a: string, b: string): number {
	const normalizedA = normalizeIngredientName(a);
	const normalizedB = normalizeIngredientName(b);
	if (!normalizedA || !normalizedB) return 0;
	if (normalizedA === normalizedB) return 1;
	if (normalizedA.includes(normalizedB) || normalizedB.includes(normalizedA)) return 0.9;

	const tokensA = tokens(a);
	const tokensB = tokens(b);
	if (tokensA.length === 0 || tokensB.length === 0) return 0;

	const setB = new Set(tokensB);
	const intersection = tokensA.filter((token) => setB.has(token)).length;
	const union = new Set([...tokensA, ...tokensB]).size;
	return union === 0 ? 0 : intersection / union;
}

export const INGREDIENT_NAME_MATCH_THRESHOLD = 0.45;

/** Converts a free-form temperature unit into C or F. */
export function normalizeTemperatureUnit(unit: unknown): 'C' | 'F' | null {
	if (typeof unit !== 'string') return null;
	const normalized = unit.trim().toUpperCase();
	return normalized === 'C' || normalized === 'F' ? normalized : null;
}

function positiveNumber(value: unknown): number | null {
	return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

type StepTiming = Pick<RecipeStep, 'timer_minutes' | 'temperature_amount' | 'temperature_unit'>;

/** Reads the timing hints shared by both step shapes. */
function normalizeStepTiming(step: Record<string, unknown>): StepTiming {
	const timerMinutes = positiveNumber(step.timer_minutes);

	let temperatureAmount = positiveNumber(step.temperature_amount);
	let temperatureUnit = normalizeTemperatureUnit(step.temperature_unit);
	if (temperatureAmount === null) {
		const legacyOven = positiveNumber(step.oven_temperature_celsius);
		if (legacyOven !== null) {
			temperatureAmount = legacyOven;
			temperatureUnit = 'C';
		}
	}
	if (temperatureAmount === null || temperatureUnit === null) {
		temperatureAmount = null;
		temperatureUnit = null;
	}

	return {
		timer_minutes: timerMinutes === null ? null : Math.round(timerMinutes),
		temperature_amount: temperatureAmount,
		temperature_unit: temperatureUnit
	};
}

/**
 * Matches each step ingredient to a top-level ingredient (via `ingredientText`)
 * and stores the matching `ingredientId`, so the client never has to
 * match ingredient names again.
 */
export function linkStepIngredients(
	steps: readonly EnrichedRecipeStep[],
	ingredients: readonly { ingredientText: string }[],
	ingredientIds: readonly (string | null)[]
): RecipeStep[] {
	const candidates = ingredients.map((ingredient, index) => ({
		name: ingredient.ingredientText,
		id: ingredientIds[index] ?? null
	}));

	return steps.map((step) => {
		const temperatureUnit = normalizeTemperatureUnit(step.temperature_unit);

		return {
			...step,
			temperature_amount: temperatureUnit ? step.temperature_amount : null,
			temperature_unit: temperatureUnit,
			ingredients: step.ingredients.map((stepIngredient): StepIngredient => {
				let best: { id: string | null; score: number } | null = null;

				for (const candidate of candidates) {
					const score = ingredientNameScore(stepIngredient.ingredientText, candidate.name);
					if (score >= INGREDIENT_NAME_MATCH_THRESHOLD && (!best || score > best.score)) {
						best = { id: candidate.id, score };
					}
				}

				return {
					ingredientId: best?.id ?? null,
					stepSubstring: stepIngredient.stepSubstring || stepIngredient.ingredientText,
					quantity: stepIngredient.quantity
				};
			})
		};
	});
}

/**
 * Normalizes steps coming from the LLM or from a cached LLM output. Keeps
 * `ingredientText` so the import can still resolve catalog ids on a cache hit.
 */
export function normalizeRecipeSteps(value: unknown): EnrichedRecipeStep[] {
	return normalizeSteps(value, (rawIngredient) => {
		const parsed = llmStepIngredientSchema.safeParse(rawIngredient);
		if (!parsed.success) return null;
		const ingredientText = parsed.data.ingredientText.trim();
		return ingredientText ? { ...parsed.data, ingredientText } : null;
	});
}

/**
 * Normalizes steps read from the database. Legacy rows that still carry
 * `ingredientText` (and no resolved id) are kept working by reusing it as the
 * highlight text.
 */
export function normalizeStoredRecipeSteps(value: unknown): RecipeStep[] {
	return normalizeSteps(value, (rawIngredient) => {
		const parsed = stepIngredientSchema.safeParse(rawIngredient);
		if (!parsed.success) return null;
		const legacyText =
			typeof (rawIngredient as Record<string, unknown>)?.ingredientText === 'string'
				? ((rawIngredient as Record<string, unknown>).ingredientText as string).trim()
				: '';
		return { ...parsed.data, stepSubstring: parsed.data.stepSubstring || legacyText };
	});
}

/**
 * Shared helper for normalizing both LLM and stored steps. The `readIngredient`
 * callback is responsible for validating and normalizing the step ingredient shape.
 */
function normalizeSteps<T>(
	value: unknown,
	readIngredient: (rawIngredient: unknown) => T | null
): {
	text: string;
	ingredients: T[];
	timer_minutes: number | null;
	temperature_amount: number | null;
	temperature_unit: 'C' | 'F' | null;
}[] {
	if (!Array.isArray(value)) return [];

	return value.flatMap((raw) => {
		if (typeof raw === 'string') {
			const text = raw.trim();
			return text ? [{ text, ingredients: [], ...normalizeStepTiming({}) }] : [];
		}
		if (!raw || typeof raw !== 'object') return [];

		const step = raw as Record<string, unknown>;
		const text = typeof step.text === 'string' ? step.text.trim() : '';
		if (!text) return [];

		const ingredients = Array.isArray(step.ingredients)
			? step.ingredients
					.map(readIngredient)
					.filter((ingredient): ingredient is T => ingredient !== null)
			: [];

		return [{ text, ingredients, ...normalizeStepTiming(step) }];
	});
}
