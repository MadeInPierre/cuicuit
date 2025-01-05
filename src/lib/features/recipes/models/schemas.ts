import { z } from 'zod';
import {
	RecipeHealthyLevel,
	RecipeMealTime,
	RecipeMotivationLevel,
	recipeCuisines,
	recipeTimesOfDay,
	recipeTools,
	recipeFoodTypes
} from '../db/recipe-doc';

export const createRecipeFormSchema = z.object({
	title: z
		.string()
		.min(3, 'Name must be at least 3 characters long.')
		.max(50, 'Name must be at most 50 characters long.'),
	description: z.string().max(500, 'Sorry, description must be at most 500 characters long.'),

	timeOfDay: z.string().refine((value) => Object.keys(recipeTimesOfDay).includes(value), {
		message: 'Invalid meal time.'
	}),
	foodType: z.string().refine((value) => Object.keys(recipeFoodTypes).includes(value), {
		message: 'Invalid food type.'
	}),
	cuisine: z.string().refine((value) => Object.keys(recipeCuisines).includes(value), {
		message: 'Invalid cuisine.'
	}),


	motivationLevel: z.number().int().min(1).max(5),
	healthyLevel: z.number().int().min(1).max(5),
	dishWasherLevel: z.number().min(1).max(5),
	dishHandLevel: z.number().min(1).max(5),

	timePrep: z.number().int().min(0).max(120),
	timeRest: z.number().int().min(0).max(120),
	timeCook: z.number().int().min(0).max(120),

	tools: z.array(
		z.string().refine((value) => Object.keys(recipeTools).includes(value), { message: 'Invalid tool.' })
	)
	// servings: z.number().int().min(1).max(20),
	// ingredients: z.enum(RecipeIngredient).array(),
	// instructions: z.enum(RecipeInstruction).array()
});

export type CreateRecipeFormSchema = typeof createRecipeFormSchema;
