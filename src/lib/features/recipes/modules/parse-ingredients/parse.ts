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
	unitSchema,
	volumeAliases,
	weightAliases,
	wholeAliases,
	type Unit
} from '$lib/shared/utils/quantity';
import { z } from 'zod';

/**
 * Represents the structured result of parsing an ingredient search input.
 */
export const parsedSearchInputSchema = z.object({
	sourceText: z.string().optional().describe('The original source text of the ingredient input.'),
	quantity: z
		.object({
			amount: z.number().describe('The numeric amount of the quantity.'),
			unitText: z.string().describe('The unit of the quantity (e.g., "cup", "g", "ml").'),
			unitKey: unitSchema.describe('The standardized key for the unit used in the database.')
		})
		.nullable(),
	linkWord: z
		.string()
		.describe('The linking word used between the quantity and ingredient, e.g. "of", "de", "d\'".'),
	ingredientText: z
		.string()
		.describe(
			'Name of the ingredient. Must be edible and easy to find in a database of common ingredients.'
		),
	description: z
		.string()
		.nullable()
		.describe('Short attitional description or ingredient variant/subitem, e.g. "large".'),
	preparation: z
		.string()
		.nullable()
		.describe('Any short preparation notes for the ingredient, e.g. "sifted, chopped".'),
	isOptional: z
		.boolean()
		.describe(
			'True if the recipe can still be made without this ingredient and retain its essential character.'
		)
});

export type ParsedSearchInput = z.infer<typeof parsedSearchInputSchema>;

/**
 * Common words that link a quantity and an ingredient.
 * This list can be expanded to support multiple languages.
 */
const linkWords = ['of', 'de', "d'", 'de', 'du', 'de la', 'des'];

/** Common aliases indicating an optional ingredient.
 * This list can be expanded to support multiple languages.
 */
const optionalAliases = ['optional', 'option', 'facultatif', 'opcional'];

/**
 * A merged lookup object for all volume and weight unit aliases.
 * This is used for efficient unit identification.
 */
const allUnitAliases = { ...volumeAliases, ...weightAliases };

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
		const ingredientText = input.slice(0, commaIndex).trim();
		const description = input.slice(commaIndex + 1).trim();
		const result = parseIngredientString(ingredientText);
		result.description = description;
		return result;
	}

	// Match the quantity and unit at the beginning of the string.
	const quantityRegex = /^(?<amount>[\d\.\/\s-]+)\s*(?<unit>[a-zA-Z]+)?/i;
	const quantityMatch = input.match(quantityRegex);

	let amount: number | null = null;
	let unitText = '';
	let unitKey = 'whole';
	let ingredientText = input;

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
		if (wholeAliases.includes(possibleUnit.toLowerCase())) {
			unitText = possibleUnit;
			unitKey = 'whole';
			ingredientText = remainingText;
			unitFound = true;
		} else {
			// Check for unit in allUnitAliases
			for (const [key, aliases] of Object.entries(allUnitAliases)) {
				const allAliases = [key, ...aliases].map((a) => a.toLowerCase());
				if (allAliases.includes(possibleUnit.toLowerCase())) {
					unitText = possibleUnit;
					unitKey = key;
					ingredientText = remainingText;
					unitFound = true;
					break;
				}
			}
		}

		if (!unitFound) {
			ingredientText = `${possibleUnit} ${remainingText}`.trim();
		}
	} else {
		// If no quantity is found, the whole input is the ingredient text.
		ingredientText = input;
	}

	// Detect and remove any linking words from the ingredient text.
	const linkWord = linkWords.find((word) =>
		ingredientText.toLowerCase().startsWith(word.toLowerCase())
	);
	if (linkWord) {
		ingredientText = ingredientText.slice(linkWord.length).trim();
	}

	return {
		sourceText: input,
		quantity: amount !== null ? { amount, unitText, unitKey: unitKey as Unit } : null,
		linkWord: linkWord || '',
		ingredientText,
		description: null,
		preparation: null,
		isOptional: optionalAliases.some((alias) => input.toLowerCase().includes(alias.toLowerCase()))
	} satisfies ParsedSearchInput;
}
