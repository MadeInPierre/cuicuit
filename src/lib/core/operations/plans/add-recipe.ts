import { z } from 'zod';

import type { TablesInsert } from '$lib/shared/db/supabase.types';

import { OpError } from '../errors.js';
import { defineOp } from '../registry.js';

export const addRecipeToPlanInput = z.object({
	spaceId: z.string().min(1),
	createdBy: z.string().min(1),
	recipeId: z.string().min(1),
	servings: z.number(),
	// Append position. Omit (or pass a negative) to append at the end — the
	// server counts the space's non-deleted meals, exactly what callers did
	// client-side before. Explicit positions behave as before.
	position: z.number().int().optional()
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
	docs: {
		title: 'Add recipe to plan',
		description:
			'Adds a recipe to a space plan as a meal with linked shopping items. Needs `spaceId` (from spaces_list), `recipeId` (from recipes_list) and `servings`; omit `position` (or pass -1) to append at the end.',
		tool: 'plan_add_recipe',
		hints: [
			'Meal-linked vs standalone: this creates a meal plus its ingredient items (`type: "meal"`). For loose items like milk or eggs, use shopping_add instead (`type: "independent"`). Review the plan via plan_list (meals) and shopping_list (items).'
		]
	},
	input: addRecipeToPlanInput,
	handler: async (ctx, { spaceId, createdBy, recipeId, servings, position }) => {
		// Omitted/negative position = append: same "meal list length" the UI
		// computed client-side (no uniqueness guarantee under races — same as before).
		let resolvedPosition = position;
		if (resolvedPosition === undefined || resolvedPosition < 0) {
			const { count, error: countError } = await ctx.supabase
				.from('space_meals')
				.select('id', { count: 'exact', head: true })
				.eq('space_id', spaceId)
				.is('deleted_at', null);
			if (countError) {
				throw new OpError('INTERNAL', 'Failed to count plan meals.', countError);
			}
			resolvedPosition = count ?? 0;
		}
		// Add the recipe to the plan and get the generated meal id
		const { data, error } = await ctx.supabase
			.from('space_meals')
			.insert({
				space_id: spaceId,
				created_by: createdBy,
				recipe_id: recipeId,
				servings,
				position: resolvedPosition
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
