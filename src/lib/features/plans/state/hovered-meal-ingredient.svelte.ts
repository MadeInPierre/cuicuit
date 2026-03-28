import type { RecipeIngredientWithTranslations } from "$lib/features/recipes/queries/get-recipe-detailed";

function createMealIngredientHoverState() {
	let hoveredMealIngredient = $state<RecipeIngredientWithTranslations | null>(null);

	return {
		get value() {
			return hoveredMealIngredient;
		},
		set value(ingredient: RecipeIngredientWithTranslations | null) {
			hoveredMealIngredient = ingredient;
		}
	};
}

export const hoveredMealIngredient = createMealIngredientHoverState();

function createMealIngredientSelectState() {
	let selectedMealIngredient = $state<RecipeIngredientWithTranslations | null>(null);

	return {
		get value() {
			return selectedMealIngredient;
		},
		set value(ing: RecipeIngredientWithTranslations | null) {
			selectedMealIngredient = ing;
		}
	};
}

export const selectedMealIngredient = createMealIngredientSelectState();
