import { languageKeys } from '$lib/features/user-settings/consts';
import { z } from 'zod';

export const createRecipeFormSchema = z
	.object({
		// General info
		language: z.enum(languageKeys).default('fr-FR'),
		title: z
			.string()
			.min(3, 'Name must be at least 3 characters long.')
			.max(50, 'Name must be at most 50 characters long.'),
		description: z.string().max(500, 'Sorry, description must be at most 500 characters long.'),

		// Images
		imageIds: z
			.array(z.string().min(1, { message: 'Please upload at least one image.' }))
			.default([]),

		// Filters (single select, enums)
		effortLevel: z.string(),
		skillLevel: z.string(),
		cleanupLevel: z.string(),
		costLevel: z.string(),

		// Filters (multi select, foreign keys to other tables)
		course_ids: z.array(z.string()).min(1, { message: 'Please select at least one course.' }),
		cuisine_ids: z.array(z.string()).min(1, { message: 'Please select at least one cuisine.' }),
		tag_ids: z.array(z.string()),
		timesofday_ids: z
			.array(z.string())
			.min(1, { message: 'Please select at least one time of day.' }),
		tool_ids: z.array(z.string()),

		// Cook times
		timePrep: z
			.number()
			.int()
			.min(0)
			.max(60 * 24),
		timeRest: z
			.number()
			.int()
			.min(0)
			.max(60 * 24),
		timeCook: z
			.number()
			.int()
			.min(0)
			.max(60 * 24),

		// Servings & Ingredients
		servings: z.number().int().min(1).max(20),
		ingredientIds: z
			.array(z.string().min(1, { message: 'Please select an ingredient.' }))
			.min(2, { message: 'Please select at least 2 ingredients.' }),
		ingredientAmounts: z
			.array(
				z
					.number()
					.min(0.1, {
						message: 'The amount must be at least 0.1.'
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
			.default(['Test', 'Test2']),
		ingredientIsOptional: z.array(z.boolean()).default([false, false]),
		ingredientRawInputs: z.array(z.string()).default(['', '']),

		// Steps
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
			.default([''])
	})
	.refine((data) => {
		const { ingredientAmounts, ingredientUnits, ingredientNames } = data;
		return (
			ingredientAmounts.length === ingredientUnits.length &&
			ingredientAmounts.length === ingredientNames.length
		);
	});

export type CreateRecipeFormSchema = typeof createRecipeFormSchema;

export const importRecipeUrlSchema = z.object({
	url: z.string().url({ message: 'Oops, please enter a valid URL.' })
});

export type ImportRecipeUrlSchema = typeof importRecipeUrlSchema;