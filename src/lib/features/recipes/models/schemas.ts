import { z } from 'zod';
import {
	RecipeHealthyLevel,
	RecipeMealTime,
	RecipeMotivationLevel,
	recipeTools
} from '../db/recipe-doc';

export const createRecipeFormSchema = z.object({
	title: z
		.string()
		.min(3, 'Name must be at least 3 characters long.')
		.max(50, 'Name must be at most 50 characters long.'),
	description: z.string().max(500, 'Sorry, description must be at most 500 characters long.'),

	// timesOfDay: z.enum(RecipeMealTime).array(),

	// motivationLevel: z.enum(RecipeMotivationLevel),
	// healthyLevel: z.enum(RecipeHealthyLevel),

	// dishWasherLevel: z.number().min(1).max(5),
	// dishHandLevel: z.number().min(1).max(5),

	timePrep: z.number().int().min(0).max(120),
	timeRest: z.number().int().min(0).max(120),
	timeCook: z.number().int().min(0).max(120),

	// Tools
	tools: z.array(z.string())
	// servings: z.number().int().min(1).max(20),
	// ingredients: z.enum(RecipeIngredient).array(),
	// instructions: z.enum(RecipeInstruction).array()
});

export type CreateRecipeFormSchema = typeof createRecipeFormSchema;
