import { languageKeySchema } from '$lib/features/user-settings/consts';
import { publicRecipeSourceTypeSchema } from '$lib/shared/db/supazod.schemas';
import { z } from 'zod';

export const createRecipeFormSchema = z
	.object({
		// General info
		language: languageKeySchema.default('fr-FR'),
		title: z
			.string()
			.min(3, 'Title must be at least 3 characters long.')
			.max(50, 'Title must be at most 50 characters long.'),
		short_title: z.string().min(1).max(40),
		description: z.string().max(500, 'Sorry, description must be at most 500 characters long.'),

		// Source
		source_type: publicRecipeSourceTypeSchema,
		source_url: z.url('Please enter a valid URL, like https://...').nullable().or(z.literal('')),

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
			.max(60 * 48),
		timeRest: z
			.number()
			.int()
			.min(0)
			.max(60 * 48),
		timeCook: z
			.number()
			.int()
			.min(0)
			.max(60 * 48),

		// Servings & Ingredients
		servings: z
			.number()
			.int()
			.min(1, { message: 'Please indicate a servings amount.' })
			.max(30, { message: 'Servings cannot go above 30.' }),
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
		ingredientDetails: z.array(z.string()).default(['', '']),
		ingredientNotes: z.array(z.string()).default(['', '']),
		ingredientPreparations: z.array(z.string()).default(['', '']),

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
			.min(1, { message: 'Please write at least one step.' })
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
	url: z.url({ message: 'Oops, please enter a valid URL.' })
});

export type ImportRecipeUrlSchema = typeof importRecipeUrlSchema;

export const importRecipeTextSchema = z.object({
	text: z.string().min(100, 'Text must be at least 100 characters long.')
});

export type ImportRecipeTextSchema = typeof importRecipeTextSchema;

export const createRecipeManualSchema = z.object({
	title: z
		.string()
		.min(3, 'Title must be at least 3 characters long.')
		.max(50, 'Title must be at most 50 characters long.')
});

export type CreateRecipeManualSchema = typeof createRecipeManualSchema;
