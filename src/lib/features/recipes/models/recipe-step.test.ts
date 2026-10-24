import { describe, expect, it } from 'vitest';
import {
	ingredientNameScore,
	linkStepIngredients,
	normalizeRecipeSteps,
	normalizeStoredRecipeSteps
} from './recipe-step';

const EMPTY_TIMING = {
	timer_minutes: null,
	temperature_amount: null,
	temperature_unit: null
};

describe('normalizeRecipeSteps (LLM/cache)', () => {
	it('returns an empty array for non-array input', () => {
		expect(normalizeRecipeSteps(null)).toEqual([]);
		expect(normalizeRecipeSteps(undefined)).toEqual([]);
		expect(normalizeRecipeSteps('nope')).toEqual([]);
	});

	it('converts legacy string steps', () => {
		expect(normalizeRecipeSteps(['Mix well.'])).toEqual([
			{ text: 'Mix well.', ingredients: [], ...EMPTY_TIMING }
		]);
	});

	it('keeps ingredientText, stepSubstring, quantities and timings', () => {
		const steps = normalizeRecipeSteps([
			{
				text: 'Bake for 12 minutes at 180°C.',
				ingredients: [
					{
						ingredientText: 'flour',
						stepSubstring: 'flour',
						quantity: { amount: 200, unitKey: 'g' }
					}
				],
				timer_minutes: 12.4,
				temperature_amount: 180,
				temperature_unit: 'c'
			}
		]);

		expect(steps[0].ingredients).toEqual([
			{
				ingredientText: 'flour',
				stepSubstring: 'flour',
				quantity: { amount: 200, unitText: '', unitKey: 'g' }
			}
		]);
		expect(steps[0].timer_minutes).toBe(12);
		expect(steps[0].temperature_amount).toBe(180);
		expect(steps[0].temperature_unit).toBe('C');
	});

	it('drops empty text, invalid ingredients and non-positive timers', () => {
		expect(
			normalizeRecipeSteps([
				'',
				{
					text: 'Cook.',
					ingredients: [{ ingredientText: '' }, { nope: true }],
					timer_minutes: 0,
					temperature_amount: 0,
					temperature_unit: 'C'
				}
			])
		).toEqual([{ text: 'Cook.', ingredients: [], ...EMPTY_TIMING }]);
	});
});

describe('normalizeStoredRecipeSteps (DB)', () => {
	it('reads the resolved ingredientId without ingredientText', () => {
		const steps = normalizeStoredRecipeSteps([
			{
				text: 'Cook.',
				ingredients: [
					{ ingredientId: 'ing-1', stepSubstring: 'butter', quantity: null },
					{ ingredientId: null, stepSubstring: 'salt', quantity: null }
				],
				...EMPTY_TIMING
			}
		]);

		expect(steps[0].ingredients).toEqual([
			{ ingredientId: 'ing-1', stepSubstring: 'butter', quantity: null },
			{ ingredientId: null, stepSubstring: 'salt', quantity: null }
		]);
	});

	it('falls back to legacy ingredientText as highlight text', () => {
		const steps = normalizeStoredRecipeSteps([
			{
				text: 'Cook.',
				ingredients: [{ ingredientText: 'flour', quantity: null }],
				timer_minutes: null,
				oven_temperature_celsius: 180
			}
		]);

		expect(steps[0].ingredients).toEqual([
			{ ingredientId: null, stepSubstring: 'flour', quantity: null }
		]);
		expect(steps[0].temperature_amount).toBe(180);
		expect(steps[0].temperature_unit).toBe('C');
	});
});

describe('linkStepIngredients', () => {
	// Real-world pairs from a French hamburger import: the step names are
	// simplified variants of the top-level ingredient names.
	const ingredients = [
		{ ingredientText: 'viande hachée de bœuf' },
		{ ingredientText: 'pain à hamburger' },
		{ ingredientText: 'beurre ou huile' },
		{ ingredientText: 'cornichon' },
		{ ingredientText: 'feuille de salade' },
		{ ingredientText: 'sel' }
	];
	const ingredientIds = ['id-beef', 'id-bun', 'id-butter', 'id-cornichon', 'id-salad', 'id-salt'];

	it('resolves every step ingredient to its catalog ingredientId', () => {
		const linked = linkStepIngredients(
			[
				{
					text: 'Assemble the burger.',
					ingredients: ingredients.map((ingredient) => ({
						ingredientText: ingredient.ingredientText,
						stepSubstring: ingredient.ingredientText,
						quantity: null
					})),
					...EMPTY_TIMING
				}
			],
			ingredients,
			ingredientIds
		);

		expect(linked[0].ingredients.map((i) => i.ingredientId)).toEqual(ingredientIds);
	});

	it('leaves truly unknown step ingredients unlinked', () => {
		const linked = linkStepIngredients(
			[
				{
					text: 'Add magic.',
					ingredients: [
						{ ingredientText: 'cornichon', stepSubstring: 'cornichons', quantity: null },
						{ ingredientText: 'unknown thing', stepSubstring: 'it', quantity: null }
					],
					...EMPTY_TIMING
				}
			],
			ingredients,
			ingredientIds
		);

		expect(linked[0].ingredients.map((i) => i.ingredientId)).toEqual(['id-cornichon', null]);
		expect(linked[0].ingredients[1].stepSubstring).toBe('it');
	});

	it('scores similar ingredient names above unrelated ones', () => {
		expect(ingredientNameScore('feuille de salade', 'feuilles de salades verte')).toBeGreaterThan(
			0.45
		);
		expect(ingredientNameScore('sel', 'poivre')).toBe(0);
	});
});
