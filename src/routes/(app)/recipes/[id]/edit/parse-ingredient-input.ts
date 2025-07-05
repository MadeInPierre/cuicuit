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
import { volumeAliases, weightAliases, wholeAliases } from '$lib/shared/utils/quantity';

/**
 * Represents the structured result of parsing an ingredient search input.
 */
export interface ParsedSearchInput {
	/** The original raw input string. */
	raw: string;
	/** The parsed components of the input string. */
	parsed: {
		/** The quantity of the ingredient, or null if not specified. */
		quantity: {
			/** The numeric amount of the quantity. */
			amount: number;
			/** The unit of the quantity (e.g., "cup", "g", "ml"). */
			unit: string;
			/** The standardized key for the unit (e.g., "cup", "gram", "milliliter"). */
			unitKey: string;
		} | null;
		/** The linking word used between the quantity and ingredient (e.g., "of", "de"). */
		linkWord: string | undefined;
		/** The name of the ingredient. */
		ingredientText: string;
		/** Any additional description or preparation instructions. */
		description: string | undefined;
	};
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
 * Represents the structured result of parsing an ingredient search input.
 */
export interface ParsedSearchInput {
	/** The original raw input string. */
	raw: string;
	/** The parsed components of the input string. */
	parsed: {
		/** The quantity of the ingredient, or null if not specified. */
		quantity: {
			/** The numeric amount of the quantity. */
			amount: number;
			/** The unit of the quantity (e.g., "cup", "g", "ml"). */
			unit: string;
			/** The standardized key for the unit (e.g., "cup", "gram", "milliliter"). */
			unitKey: string;
		} | null;
		/** The linking word used between the quantity and ingredient (e.g., "of", "de"). */
		linkWord: string | undefined;
		/** The name of the ingredient. */
		ingredientText: string;
		/** Any additional description or preparation instructions. */
		description: string | undefined;
	};
}

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
export function parseIngredientSearchInput(input: string): ParsedSearchInput {
	input = input.trim(); // Remove extra spaces from input

	// If the input contains no numbers, treat it as an ingredient-only string.
	if (!/\d/.test(input)) {
		return {
			raw: input,
			parsed: {
				quantity: null,
				linkWord: '',
				ingredientText: input.trim(),
				description: ''
			}
		};
	}

	// Match the input against the regex pattern.
	const match = input.match(regex);
	if (!match) {
		// If no match is found, return the input as the ingredient text.
		return {
			raw: input,
			parsed: {
				quantity: null,
				linkWord: '',
				ingredientText: input.trim(),
				description: ''
			}
		};
	}

	// Extract the matched groups: amount, unit, ingredient text, and optional description.
	let [, amountStr, possibleUnit, ingredientText, description] = match;
	amountStr = amountStr ? amountStr.trim() : '';
	possibleUnit = possibleUnit ? possibleUnit.trim().toLowerCase() : '';
	ingredientText = ingredientText ? ingredientText.trim() : '';
	description = description ? description.trim() : '';

	// Parse the amount, handling ranges and fractions.
	let amount: number | null = null;
	if (amountStr) {
		if (amountStr.includes('-')) {
			// If the amount is a range, calculate the average.
			const [start, end] = amountStr.split('-').map((s) => convertFractionToDecimal(s.trim()));
			amount = (start + end) / 2;
		} else {
			// Otherwise, convert the fraction to a decimal.
			amount = convertFractionToDecimal(amountStr);
		}
	}

	let unit = ''; // Default unit is an empty string.
	let unitKey = 'whole'; // Default unit key is 'whole'.

	// Identify the unit and its standardized key.
	if (wholeAliases.includes(possibleUnit)) {
		// If the unit is a whole unit, set it directly.
		unit = possibleUnit;
		unitKey = 'whole';
	} else {
		// Otherwise, check for a match in the volume and weight aliases.
		for (const [key, aliases] of Object.entries(allUnitAliases)) {
			const allAliases = [key, ...aliases].map((a) => a.toLowerCase());
			for (const alias of allAliases) {
				if (possibleUnit.startsWith(alias)) {
					// If a match is found, set the unit and unit key.
					unit = alias;
					unitKey = key;
					// Any remaining part of the possible unit is part of the ingredient name.
					ingredientText = possibleUnit.slice(alias.length).trim() + ' ' + ingredientText;
					break;
				}
			}
			if (unit) break; // Stop searching once a unit is found.
		}
	}

	// If no unit was identified, assume the detected unit is part of the ingredient name.
	if (!unit) {
		ingredientText = `${possibleUnit} ${ingredientText}`.trim();
	}

	// Detect and remove any linking words from the ingredient text.
	const linkWord = linkWords.find((word) =>
		ingredientText.toLowerCase().startsWith(word.toLowerCase())
	);
	if (linkWord) {
		ingredientText = ingredientText.slice(linkWord.length).trim();
	}

	// Return the structured result.
	return {
		raw: input,
		parsed: {
			quantity: amount !== null ? { amount, unit, unitKey } : null,
			linkWord,
			ingredientText,
			description
		}
	};
}
