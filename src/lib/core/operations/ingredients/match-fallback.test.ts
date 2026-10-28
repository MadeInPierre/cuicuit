import { describe, expect, it } from 'vitest';

import {
	ingredientMatchTiers,
	matchIngredientNames,
	type IngredientNameCandidate
} from './match-fallback.js';

describe('ingredientMatchTiers', () => {
	it('tries the recipe language first for curated languages', () => {
		expect(ingredientMatchTiers('fr-FR').map((tier) => [tier.field, tier.lang])).toEqual([
			['ingredientName', 'fr-FR'],
			['ingredientNameEn', 'en-US'],
			['ingredientNameEnGeneral', 'en-US']
		]);
	});

	it('skips the original name for unsupported languages', () => {
		expect(ingredientMatchTiers('uk-UA').map((tier) => [tier.field, tier.lang])).toEqual([
			['ingredientNameEn', 'en-US'],
			['ingredientNameEnGeneral', 'en-US']
		]);
	});
});

describe('matchIngredientNames', () => {
	const candidate = (
		overrides: Partial<IngredientNameCandidate> = {}
	): IngredientNameCandidate => ({
		ingredientName: 'farine',
		ingredientNameEn: 'flour',
		ingredientNameEnGeneral: 'flour',
		...overrides
	});

	it('falls back tier by tier only for unmatched candidates', async () => {
		const calls: Array<[string[], string]> = [];
		const results = await matchIngredientNames(
			[candidate(), candidate({ ingredientName: 'sucre', ingredientNameEn: 'sugar' })],
			'fr-FR',
			async (names, lang) => {
				calls.push([names, lang]);
				return names.map((name) => {
					if (name === 'farine') return ['flour-id'];
					if (name === 'sugar') return ['sugar-id'];
					return [];
				});
			}
		);

		expect(calls).toEqual([
			[['farine', 'sucre'], 'fr-FR'],
			[['sugar'], 'en-US']
		]);
		expect(results).toEqual([['flour-id'], ['sugar-id']]);
	});

	it('keeps results aligned when a candidate never matches', async () => {
		const results = await matchIngredientNames(
			[
				candidate(),
				candidate({ ingredientName: '', ingredientNameEn: '', ingredientNameEnGeneral: '' })
			],
			'fr-FR',
			async (names) => names.map(() => ['match'])
		);

		expect(results).toEqual([['match'], []]);
	});
});
