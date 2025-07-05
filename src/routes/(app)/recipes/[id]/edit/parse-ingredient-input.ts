import { volumeAliases, weightAliases, wholeAliases } from '$lib/shared/utils/quantity';

export interface ParsedSearchInput {
	raw: string;
	parsed: {
		quantity: {
			amount: number;
			unit: string;
			unitKey: string;
		} | null;
		linkWord: string | undefined;
		ingredientText: string;
		description: string | undefined;
	};
}

// Common words that indicate a link between quantity and ingredient
const linkWords = ['of', 'de', "d'"];

// Merge volume and weight units into a single lookup object
const allUnitAliases = { ...volumeAliases, ...weightAliases };

// Regular expression to extract quantity, unit, and ingredient text
const regex = /^([\d\.]+)\s*([a-zA-Z]+)?\s*(?:of\s+)?([^,]+)(?:,\s*(.*))?$/i;

export function parseIngredientSearchInput(input: string): ParsedSearchInput {
	input = input.trim(); // Remove extra spaces from input

	// If input contains no numbers, treat it as ingredient-only with null quantity
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

	// Match input against the regex pattern
	const match = input.match(regex);
	if (!match) {
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

	// Extract the matched groups: amount, unit, ingredient text, and optional description
	let [, amount, possibleUnit, ingredientText, description] = match;
	amount = amount ? amount.trim() : '';
	possibleUnit = possibleUnit ? possibleUnit.trim().toLowerCase() : '';
	ingredientText = ingredientText ? ingredientText.trim() : '';
	description = description ? description.trim() : '';

	let unit = ''; // Default unit as empty
	let unitKey = 'whole'; // Default to 'whole' unless a different unit is found

	// Check if the detected unit belongs to whole units (e.g., eggs, pieces, slices)
	if (wholeAliases.includes(possibleUnit)) {
		unit = possibleUnit;
		unitKey = 'whole';
	} else {
		// Check if the unit matches any volume or weight aliases
		for (const [key, aliases] of Object.entries(allUnitAliases)) {
			if (key === possibleUnit || aliases.includes(possibleUnit)) {
				unit = possibleUnit;
				unitKey = key;
				break; // Stop once a match is found
			}
		}
	}

	// If no unit was identified, assume the detected unit is part of the ingredient name
	if (!unit) {
		ingredientText = `${possibleUnit} ${ingredientText}`.trim();
	}

	// Detect if the ingredient text starts with a linking word (e.g., "of")
	const linkWord = linkWords.find((word) =>
		ingredientText.toLowerCase().startsWith(word.toLowerCase())
	);

	// Remove the linking word from the ingredient text if found
	if (linkWord) {
		ingredientText = ingredientText.slice(linkWord.length).trim();
	}

	return {
		raw: input,
		parsed: {
			quantity: amount ? { amount: parseFloat(amount), unit, unitKey } : null,
			linkWord,
			ingredientText,
			description
		}
	};
}
