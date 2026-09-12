import { capitalize } from '$lib/utils';

/** Minimal shape of an ingredient translation needed to resolve a display name. */
export type IngredientTranslationLike = {
	name_singular: string | null;
	name_plural: string | null;
	language?: { lang: string } | null;
};

/**
 * Normalizes free-text ingredient names (custom ingredients not in the catalog).
 * Single place to keep the formatting consistent between recipes and shopping lists.
 */
export function buildCustomIngredientName(rawText: string | null | undefined): string {
	return capitalize(rawText?.trim());
}

/**
 * Resolves the display name of an ingredient, whether it is a catalog ingredient
 * (uses its translation) or a custom one (uses its free-text name).
 * Falls back to 'Unknown ingredient' when nothing is available.
 */
export function resolveIngredientName(
	translations: IngredientTranslationLike[] | null | undefined,
	opts?: {
		lang?: string | null;
		plural?: boolean;
		customName?: string | null;
	}
): string {
	const translation =
		(opts?.lang ? translations?.find((t) => t.language?.lang === opts.lang) : undefined) ||
		translations?.[0] ||
		null;

	const catalogName = opts?.plural
		? translation?.name_plural || translation?.name_singular
		: translation?.name_singular || translation?.name_plural;

	return catalogName || opts?.customName || 'Unknown ingredient';
}

/** A custom ingredient is one without a catalog match (ingredient_id is null). */
export function isCustomIngredient(ingredientId: string | null | undefined): boolean {
	return ingredientId == null;
}
