import {
	normalizeIngredientName,
	type StepIngredient
} from '$lib/features/recipes/models/recipe-step';

/** A top-level recipe ingredient that can be linked to a step. */
export type StepIngredientOption = {
	key: string;
	ingredientId: string | null;
	name: string;
	customName: string | null;
	amount: number;
	unit: string;
};

/** Stable key for a custom (not in the catalog) ingredient name. */
export function customOptionKey(name: string | null | undefined): string {
	return `custom:${normalizeIngredientName(name ?? '')}`;
}

/** Stable key for the top-level ingredient a step hint points at. */
export function stepIngredientOptionKey(option: StepIngredientOption): string {
	return option.key;
}

/** Stable key for an existing step ingredient reference. */
export function stepIngredientRefKey(ref: StepIngredient): string {
	return ref.ingredientId ? `id:${ref.ingredientId}` : customOptionKey(ref.stepSubstring);
}

/**
 * Resolves the top-level ingredient a step hint points at. Custom ingredients
 * fall back to a name match because they have no catalog id.
 */
export function findStepIngredientOption(
	ref: StepIngredient,
	options: readonly StepIngredientOption[]
): StepIngredientOption | undefined {
	const key = stepIngredientRefKey(ref);
	return options.find((option) => option.key === key);
}
