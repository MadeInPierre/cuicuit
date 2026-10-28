/**
 * This file contains the logic for parsing a raw ingredient search input string into a structured object.
 * It identifies the quantity, unit, ingredient name, and any additional description.
 *
 * The main export is the `parseIngredientSearchInput` function, which takes a raw string
 * and returns a `ParsedSearchInput` object.
 *
 * The parser is designed to handle various formats, including:
 * - "1 cup of flour, sifted"
 * - "2-3 large eggs"
 * - "1/2 tsp of salt"
 * - "sugar" (no quantity)
 */
import {
	ingredientQuantitySchema,
	unitAliases,
	type UnitUnregionized
} from '$lib/shared/utils/quantity';
import { z } from 'zod';

/**
 * Represents the structured result of parsing an ingredient search input.
 */
export const parsedSearchInputSchema = z.object({
	sourceText: z.string().default('').catch('').describe('Original full text of the ingredient.'),
	quantity: ingredientQuantitySchema.nullable().default(null).catch(null),
	linkWord: z
		.string()
		.nullable()
		.default(null)
		.catch(null)
		.describe('Linking word used between quantity and ingredient, e.g. "of", "de", "d\'".'),
	ingredientName: z
		.string()
		.default('')
		.catch('')
		.describe(
			'Name of ingredient in the original recipe language. Must be edible and easy to find in a database of common ingredients.'
		),
	ingredientNameEn: z
		.string()
		.default('')
		.catch('')
		.describe('English translation of ingredientName.'),
	ingredientNameEnGeneral: z
		.string()
		.default('')
		.catch('')
		.describe(
			'A more general/common English name for the same ingredient.'
		),
	description: z
		.string()
		.nullable()
		.default(null)
		.catch(null)
		.describe('Short attitional description or ingredient variant/subitem, e.g. "large".'),
	preparation: z
		.string()
		.nullable()
		.default(null)
		.catch(null)
		.describe('Any short preparation notes for ingredient, e.g. "sifted, chopped".'),
	isOptional: z
		.boolean()
		.default(false)
		.catch(false)
		.describe(
			'Considered optional if the recipe title remains valid when cooked without this ingredient.'
		)
});

export type ParsedSearchInput = z.infer<typeof parsedSearchInputSchema>;

/**
 * Common words that link a quantity and an ingredient.
 * This list can be expanded to support multiple languages.
 */
const linkWords = ['of', 'de la', 'de', 'du', 'des', "d'"];

/**
 * Make d' a special case to tolerate being glued to the ingredient name, while refusing
 * for other link words like "of,de,la" to be glued to avoid cutting words.
 */
const linkWordPattern = new RegExp(
	`^(?:(?:${linkWords.filter((word) => !word.endsWith("'")).join('|')})\\s+|${linkWords
		.filter((word) => word.endsWith("'"))
		.join('|')})`,
	'i'
);

/** Common aliases indicating an optional ingredient.
 * This list can be expanded to support multiple languages.
 */
const optionalAliases = ['optional', 'option', 'facultatif', 'opcional'];

/**
 * Converts a fractional string to its decimal equivalent.
 *
 * @param fraction The fractional string (e.g., "1/2", "3/4").
 * @returns The decimal representation of the fraction.
 */
function convertFractionToDecimal(fraction: string): number {
	const parts = fraction.split('/');
	if (parts.length === 2) {
		return parseInt(parts[0], 10) / parseInt(parts[1], 10);
	}
	return parseFloat(fraction);
}

/**
 * Parses a raw ingredient search input string into a structured object.
 *
 * @param input The raw ingredient search input string.
 * @returns A `ParsedSearchInput` object.
 */
export function parseIngredientString(input: string): ParsedSearchInput {
	input = input.trim(); // Remove extra spaces from input

	// Manual override for ingredient/description separation
	const commaIndex = input.indexOf(',');
	if (commaIndex !== -1) {
		const ingredientName = input.slice(0, commaIndex).trim();
		const description = input.slice(commaIndex + 1).trim();
		const result = parseIngredientString(ingredientName);
		result.description = description;
		return result;
	}

	// Match the quantity and unit at the beginning of the string.
	const quantityRegex = /^(?<amount>[\d./\s-]+)\s*(?<unit>[a-zA-Z]+)?/i;
	const quantityMatch = input.match(quantityRegex);

	let amount: number | null = null;
	let unitText = '';
	let unitKey = 'whole';
	let ingredientName = input;

	if (quantityMatch && quantityMatch.groups) {
		const { amount: amountStr, unit: possibleUnit = '' } = quantityMatch.groups;

		if (amountStr) {
			if (amountStr.includes('-')) {
				const [start, end] = amountStr.split('-').map((s) => convertFractionToDecimal(s.trim()));
				amount = (start + end) / 2;
			} else {
				amount = convertFractionToDecimal(amountStr);
			}
		}

		const remainingText = input.slice(quantityMatch[0].length).trim();
		let unitFound = false;

		// Check for unit in wholeAliases
		if ((unitAliases.whole as unknown as string[]).includes(possibleUnit.toLowerCase())) {
			unitText = possibleUnit;
			unitKey = 'whole';
			ingredientName = remainingText;
			unitFound = true;
		} else {
			// Check for unit in unitAliases
			for (const [key, aliases] of Object.entries(unitAliases)) {
				const allAliases = [key, ...aliases].map((a) => a.toLowerCase());
				if (allAliases.includes(possibleUnit.toLowerCase())) {
					unitText = possibleUnit;
					unitKey = key;
					ingredientName = remainingText;
					unitFound = true;
					break;
				}
			}
		}

		if (!unitFound) {
			ingredientName = `${possibleUnit} ${remainingText}`.trim();
		}
	} else {
		// If no quantity is found, the whole input is the ingredient text.
		ingredientName = input;
	}

	// Detect and remove any linking words from the ingredient text.
	const linkWordMatch = ingredientName.match(linkWordPattern);
	const linkWord = linkWordMatch?.[0].trim();
	if (linkWordMatch) {
		ingredientName = ingredientName.slice(linkWordMatch[0].length).trim();
	}

	return {
		sourceText: input,
		quantity: amount !== null ? { amount, unitText, unitKey: unitKey as UnitUnregionized } : null,
		linkWord: linkWord || '',
		ingredientName,
		ingredientNameEn: '',
		ingredientNameEnGeneral: '',
		description: null,
		preparation: null,
		isOptional: optionalAliases.some((alias) => input.toLowerCase().includes(alias.toLowerCase()))
	} satisfies ParsedSearchInput;
}
