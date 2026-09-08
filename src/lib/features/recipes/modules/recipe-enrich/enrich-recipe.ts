import type { EnrichedRecipeOutput } from './enrich-recipe.remote';

// Fields of the enriched recipe that map to NOT NULL `recipes` columns.
export type RecipeNotNullFields = Pick<
	EnrichedRecipeOutput['recipe'],
	| 'title'
	| 'short_title'
	| 'servings'
	| 'cleanup_level'
	| 'cost_level'
	| 'skill_level'
	| 'effort_level'
	| 'courses'
	| 'cuisines'
	| 'times_of_day'
	| 'tools'
>;

// Defaults mirror the draft recipe created by createDraftRecipe.
const RECIPE_NOT_NULL_DEFAULTS: RecipeNotNullFields = {
	title: 'Unknown Recipe',
	short_title: 'Unknown',
	servings: 4,
	cleanup_level: 'none',
	cost_level: 'budget',
	skill_level: 'beginner',
	effort_level: 'low',
	courses: ['main'],
	cuisines: [],
	times_of_day: [],
	tools: []
};

function sanitizeRecipeFields(recipe: EnrichedRecipeOutput['recipe']): RecipeNotNullFields {
	return {
		title: recipe.title || RECIPE_NOT_NULL_DEFAULTS.title,
		short_title: recipe.short_title || RECIPE_NOT_NULL_DEFAULTS.short_title,
		servings: recipe.servings || RECIPE_NOT_NULL_DEFAULTS.servings,
		cleanup_level: recipe.cleanup_level ?? RECIPE_NOT_NULL_DEFAULTS.cleanup_level,
		cost_level: recipe.cost_level ?? RECIPE_NOT_NULL_DEFAULTS.cost_level,
		skill_level: recipe.skill_level ?? RECIPE_NOT_NULL_DEFAULTS.skill_level,
		effort_level: recipe.effort_level ?? RECIPE_NOT_NULL_DEFAULTS.effort_level,
		courses: recipe.courses?.length ? recipe.courses : RECIPE_NOT_NULL_DEFAULTS.courses,
		cuisines: recipe.cuisines ?? RECIPE_NOT_NULL_DEFAULTS.cuisines,
		times_of_day: recipe.times_of_day ?? RECIPE_NOT_NULL_DEFAULTS.times_of_day,
		tools: recipe.tools ?? RECIPE_NOT_NULL_DEFAULTS.tools
	};
}

/**
 * Returns a recipe object fully compliant with the DB's NOT NULL constraints,
 * no matter what the LLM returned. Applied by the enrich module on fresh output
 * and by the import cache when reading previously-cached (maybe partially
 * repaired) output.
 */
export function sanitizeEnrichedRecipeOutput(output: EnrichedRecipeOutput): EnrichedRecipeOutput {
	return {
		...output,
		recipe: {
			...output.recipe,
			...sanitizeRecipeFields(output.recipe)
		}
	};
}
