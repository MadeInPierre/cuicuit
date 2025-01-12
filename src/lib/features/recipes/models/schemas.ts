import { string, z } from 'zod';
import {
	recipeCuisines,
	recipeTimesOfDay,
	recipeTools,
	recipeFoodTypes,
	type RecipeStep
} from '../db/recipe-doc';

export const createRecipeFormSchema = z
	.object({
		title: z
			.string()
			.min(3, 'Name must be at least 3 characters long.')
			.max(50, 'Name must be at most 50 characters long.'),
		description: z.string().max(500, 'Sorry, description must be at most 500 characters long.'),

		timeOfDay: z
			.string({ message: 'Please select a value.' })
			.refine((value) => Object.keys(recipeTimesOfDay).includes(value), {
				message: 'Please select a value.'
			}),
		foodType: z
			.string({ message: 'Please select a value.' })
			.refine((value) => Object.keys(recipeFoodTypes).includes(value), {
				message: 'Please select a value.'
			}),
		cuisine: z
			.string({ message: 'Please select a value.' })
			.refine((value) => Object.keys(recipeCuisines).includes(value), {
				message: 'Please select a value.'
			}),

		motivationLevel: z.number().int().min(1, 'Please select a value.').max(5),
		healthyLevel: z.number().int().min(1, 'Please select a value.').max(5),
		dishWasherLevel: z.number().min(1, 'Please select a value.').max(5),
		dishHandLevel: z.number().min(1, 'Please select a value.').max(5),

		timePrep: z.number().int().min(0).max(120),
		timeRest: z.number().int().min(0).max(120),
		timeCook: z.number().int().min(0).max(120),

		tools: z
			.array(
				z
					.string()
					.refine((value) => Object.keys(recipeTools).includes(value), { message: 'Invalid tool.' })
			)
			.min(0),

		stepDescriptions: z
			.array(
				z
					.string()
					.min(3, {
						message: 'The step description must be at least 3 characters long.'
					})
					.max(500, {
						message: 'The step description must be at most 500 characters long.'
					})
			)
			.min(1)
			.default(['']),

		servings: z.number().int().min(1).max(20),

		ingredientAmounts: z
			.array(
				z
					.number()
					.min(1, {
						message: 'The amount must be at least 1.'
					})
					.max(1000, {
						message: 'The amount must be less than 1000.'
					})
			)
			.default([1, 1]),
		ingredientUnits: z
			.array(
				z
					.string()
					.min(1, {
						message: 'Please select a unit.'
					})
					.max(50)
			)
			.default(['g', 'g']),
		ingredientNames: z
			.array(
				z
					.string()
					.min(3, {
						message: 'The ingredient name must be at least 3 characters long.'
					})
					.max(50, {
						message: 'The ingredient name must be at most 50 characters long.'
					})
			)
			.default(['', ''])
	})
	.refine((data) => {
		const { ingredientAmounts, ingredientUnits, ingredientNames } = data;
		return (
			ingredientAmounts.length === ingredientUnits.length &&
			ingredientAmounts.length === ingredientNames.length
		);
	});

export type CreateRecipeFormSchema = typeof createRecipeFormSchema;
