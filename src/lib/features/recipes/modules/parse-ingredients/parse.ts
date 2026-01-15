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
import { volumeAliases, weightAliases, wholeAliases, type Unit } from '$lib/shared/utils/quantity';

/**
 * Represents the structured result of parsing an ingredient search input.
 */
export interface ParsedSearchInput {
	/** The original source text of the ingredient input. */
	sourceText?: string;
	/** The quantity of the ingredient, or null if not specified. */
	quantity: {
		/** The numeric amount of the quantity. */
		amount: number;
		/** The unit of the quantity (e.g., "cup", "g", "ml"). */
		unit: string;
		/** The standardized key for the unit (e.g., "cup", "gram", "milliliter"). */
		unitKey: Unit;
	} | null;
	/** The linking word used between the quantity and ingredient (e.g., "of", "de"). */
	linkWord: string | undefined;
	/** The name of the ingredient. */
	ingredientText: string;
	/** Any additional description or preparation instructions. */
	description: string | undefined;
}

/**
 * Common words that link a quantity and an ingredient.
 * This list can be expanded to support multiple languages.
 */
const linkWords = ['of', 'de', "d'", 'de', 'du', 'de la', 'des'];

/**
 * A merged lookup object for all volume and weight unit aliases.
 * This is used for efficient unit identification.
 */
const allUnitAliases = { ...volumeAliases, ...weightAliases };

/**
 * A regular expression to extract the quantity, unit, ingredient, and description from the input string.
 *
 * Breakdown of the regex:
 * - `^([\d\.\/\s-]+)`: Captures the quantity, which can include numbers, dots, slashes, spaces, and hyphens.
 * - `\s*`: Matches any whitespace.
 * - `([a-zA-Z]+)?`: Optionally captures the unit as a sequence of letters.
 * - `\s*`: Matches any whitespace.
 * - `(?:of\s+)?`: Optionally matches the link word "of" followed by whitespace.
 * - `([^,]+)`: Captures the ingredient text, which is any sequence of characters except a comma.
 * - `(?:,\s*(.*))?`: Optionally captures the description, which is anything after a comma.
 * - `/**
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
const regex = /^([\d\.\/\s-]+)\s*([a-zA-Z]+)?\s*(?:of\s+)?([^,]+)(?:,\s*(.*))?$/i;

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
	let unit = '';
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
			unit = possibleUnit;
			unitKey = 'whole';
			ingredientText = remainingText;
			unitFound = true;
		} else {
			// Check for unit in allUnitAliases
			for (const [key, aliases] of Object.entries(allUnitAliases)) {
				const allAliases = [key, ...aliases].map((a) => a.toLowerCase());
				if (allAliases.includes(possibleUnit.toLowerCase())) {
					unit = possibleUnit;
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
		quantity: amount !== null ? { amount, unit, unitKey: unitKey as Unit } : null,
		linkWord,
		ingredientText,
		description: undefined
	} satisfies ParsedSearchInput;
}
