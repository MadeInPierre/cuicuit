import { getClientCtx, runOp } from '$lib/core/operations/client.js';
import { deleteMealOp } from '$lib/core/operations/plans/delete-meal.js';
import { moveMealOp } from '$lib/core/operations/plans/move-meal.js';
import { updateServingsOp } from '$lib/core/operations/plans/update-servings.js';
import type { ActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
import { toast } from 'svelte-sonner';
import type { MealWithRecipeAndIngredients } from '../queries/get-plan-meals';

// Thin adapters over the `plans.update-servings` / `plans.move-meal` /
// `plans.delete-meal` ops. DB work lives in core; optimistic local state,
// toast and refresh stay here so callers don't change.

export async function updateMealServings(
	activeSpace: ActiveSpaceState,
	meal: MealWithRecipeAndIngredients,
	servings: number,
	options?: { skipRefresh?: boolean }
) {
	let ctx;
	try {
		ctx = await getClientCtx();
	} catch {
		throw new Error('Supabase client not available');
	}
	if (!activeSpace || !activeSpace.activeSpace || !activeSpace.activePlanMeals)
		throw new Error('No active space or active plan found');
	if (servings < 1) throw new Error('Servings must be at least 1');

	await runOp(updateServingsOp.name, ctx, {
		spaceId: activeSpace.activeSpace.id,
		mealId: meal.id,
		servings,
		recipeServings: meal.recipe.servings,
		ingredients: meal.recipe.recipe_ingredients.map((ing) => ({
			ingredientId: ing.ingredient_id,
			customName: ing.custom_name,
			quantity: ing.quantity
		}))
	});

	// Refresh the active plan meals after updating
	if (options?.skipRefresh) return;
	await activeSpace.refreshActivePlanMeals({ refreshShoppingList: false });
	await activeSpace.refreshActivePlanItems({ refreshShoppingList: true });
}

export async function updateMealPosition(
	activeSpace: ActiveSpaceState,
	mealId: string,
	position: number,
	options?: { skipRefresh?: boolean }
) {
	let ctx;
	try {
		ctx = await getClientCtx();
	} catch {
		throw new Error('Supabase client not available');
	}
	if (!activeSpace || !activeSpace.activeSpace || !activeSpace.activePlanMeals)
		throw new Error('No active space or active plan found');
	if (!mealId) throw new Error('Meal ID not provided');
	if (position < 0) throw new Error('Position must be a non-negative integer');

	await runOp(moveMealOp.name, ctx, { mealId, position });

	// Refresh the active plan meals after updating
	if (options?.skipRefresh) return;
	await activeSpace.refreshActivePlanMeals({ refreshShoppingList: false });
	await activeSpace.refreshActivePlanItems({ refreshShoppingList: true });
}

export async function deleteMeal(
	activeSpace: ActiveSpaceState,
	mealId: string,
	options?: {
		skipRefresh?: boolean;
		undo?: boolean;
		toastId?: string | number;
		hideToast?: boolean;
		cooked?: boolean;
	}
) {
	let ctx;
	try {
		ctx = await getClientCtx();
	} catch {
		throw new Error('Supabase client not available');
	}
	if (!activeSpace || !activeSpace.activeSpace || !activeSpace.activePlanMeals)
		throw new Error('No active space or active plan found');
	if (!mealId) throw new Error('Meal ID not provided');

	// Optimistically delete the meal in the local state
	if (!options?.undo) {
		activeSpace.activePlanMeals = activeSpace.activePlanMeals.filter((meal) => meal.id !== mealId);
	}

	await runOp(deleteMealOp.name, ctx, {
		mealId,
		undo: options?.undo ?? false,
		cooked: options?.cooked ?? false
	});

	const cooked = options?.undo ? false : (options?.cooked ?? false);
	if (options?.undo) {
		toast.success('Meal restored', { description: 'We got it back!', id: options?.toastId });
	} else if (!options?.hideToast) {
		if (cooked) {
			const id = toast.success('Marked as cooked', {
				description: 'Bon appétit !',
				action: {
					label: 'Undo',
					onClick: () =>
						deleteMeal(activeSpace, mealId, { skipRefresh: false, undo: true, toastId: id })
				}
			});
		} else {
			const id = toast.success('Meal deleted', {
				description: 'It looked yummy though',
				action: {
					label: 'Undo',
					onClick: () =>
						deleteMeal(activeSpace, mealId, { skipRefresh: false, undo: true, toastId: id })
				}
			});
		}
	}

	if (options?.skipRefresh) return;
	await activeSpace.refreshActivePlanMeals({ refreshShoppingList: false });
	await activeSpace.refreshActivePlanItems({ refreshShoppingList: true });
}
