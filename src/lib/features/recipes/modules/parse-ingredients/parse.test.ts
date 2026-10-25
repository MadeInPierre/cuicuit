import { describe, expect, it } from 'vitest';
import { parsedSearchInputSchema, parseIngredientString } from './parse';

describe('parsedSearchInputSchema', () => {
	it('defaults a missing unitText instead of dropping the quantity', () => {
		const result = parsedSearchInputSchema.safeParse({
			sourceText: '2 tbsp butter',
			quantity: { amount: 2, unitKey: 'tbsp' },
			linkWord: null,
			ingredientText: 'butter',
			description: null,
			preparation: null,
			isOptional: false
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.quantity).toEqual({ amount: 2, unitText: '', unitKey: 'tbsp' });
		}
	});
});

describe('parseIngredientString', () => {
	it.each(['duck breast', 'desiccated coconut', 'demerara sugar', 'offal'])(
		'does not treat the start of "%s" as a link word',
		(input) => {
			const parsed = parseIngredientString(input);
			expect(parsed.ingredientText).toBe(input);
			expect(parsed.linkWord).toBe('');
		}
	);

	it.each([
		['2 tbsp of sugar', 'sugar', 'of'],
		['1 kg de farine', 'farine', 'de'],
		['de la farine', 'farine', 'de la'],
		["d'agneau", 'agneau', "d'"]
	])('strips a real link word from "%s"', (input, ingredientText, linkWord) => {
		const parsed = parseIngredientString(input);
		expect(parsed.ingredientText).toBe(ingredientText);
		expect(parsed.linkWord).toBe(linkWord);
	});
});
