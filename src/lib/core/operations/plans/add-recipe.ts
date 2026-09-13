import { z } from 'zod';

import type { TablesInsert } from '$lib/shared/db/supabase.types';

import { OpError } from '../errors.js';
import { defineOp } from '../registry.js';

export const addRecipeToPlanInput = z.object({
	spaceId: z.string().min(1),
	createdBy: z.string().min(1),
	recipeId: z.string().min(1),
	servings: z.number(),
	// Append position, computed by the caller from its meal list (local-first friendly).
	position: z.number().int().min(0)
});

export type AddRecipeToPlanInput = z.infer<typeof addRecipeToPlanInput>;

export type AddRecipeToPlanOutput = {
	mealId: string;
	itemsAdded: number;
};

/**
 * Adds a recipe to a space's plan: inserts the meal, then links every recipe
 * ingredient (catalog or custom) as a `meal` shopping item so it shows up in
 * the MealCard. Moved from `features/plans/actions/add-recipe-to-plan.ts`
 * (toast/goto/refresh stripped — the adapter keeps those, this returns data).
 */
export const addRecipeToPlanOp = defineOp({
	name: 'plans.add-recipe',
	domain: 'plans',
	kind: 'write',
	sync: 'synced',
	input: addRecipeToPlanInput,
	handler: async (ctx, { spaceId, createdBy, recipeId, servings, position }) => {
		// Add the recipe to the plan and get the generated meal id
		const { data, error } = await ctx.supabase
			.from('space_meals')
			.insert({
				space_id: spaceId,
				created_by: createdBy,
				recipe_id: recipeId,
				servings,
				position
			})
			.select('id')
			.single();

		if (error || !data) {
			throw new OpError('INTERNAL', 'Failed to add recipe to plan.', error);
		}

		const mealId = data.id;

		// Add the recipe's ingredients to the plan's shopping list
		const { data: recipeIngredients, error: ingredientsError } = await ctx.supabase
			.from('recipe_ingredients')
			.select('*')
			.eq('recipe_id', recipeId);

		if (ingredientsError || !recipeIngredients) {
			throw new OpError('INTERNAL', 'Failed to fetch recipe ingredients.', ingredientsError);
		}

		// Every recipe ingredient (catalog or custom) stays linked to the meal so it
		// shows up in the MealCard; customs carry their free-text custom_name instead
		// of an ingredient_id (allowed by the space_items CHECK constraint).
		const shoppingListItems = recipeIngredients.map(
			(ingredient) =>
				({
					space_id: spaceId,
					created_by: createdBy,
					type: 'meal',
					meal_id: mealId,
					meal_origin: 'recipe',
					ingredient_id: ingredient.ingredient_id,
					priority: ingredient.is_optional ? 'optional' : 'required',
					name: ingredient.ingredient_id
						? ingredient.raw_input
						: (ingredient.custom_name ?? ingredient.raw_input),
					quantity: ingredient.quantity ?? 1,
					unit: ingredient.unit
				}) satisfies TablesInsert<'space_items'>
		);

		const { error: shoppingListError } = await ctx.supabase
			.from('space_items')
			.insert(shoppingListItems);

		if (shoppingListError) {
			throw new OpError(
				'INTERNAL',
				'Failed to add ingredients to shopping list.',
				shoppingListError
			);
		}

		const output: AddRecipeToPlanOutput = { mealId, itemsAdded: shoppingListItems.length };
		return output;
	}
});
