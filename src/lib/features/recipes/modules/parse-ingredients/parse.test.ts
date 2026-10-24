import { describe, expect, it } from 'vitest';
import { parsedSearchInputSchema } from './parse';

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
