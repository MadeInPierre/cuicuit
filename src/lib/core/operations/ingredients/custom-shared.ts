/**
 * Shared helpers for the M3 custom-ingredient ops (`list-custom`,
 * `relink-custom`).
 */
import { z } from 'zod';

/**
 * Grouping key for free-text ingredient names. Mirrors the DB's
 * case-insensitive custom uniqueness
 * (`recipe_ingredients_recipe_custom_uniq` on `lower(custom_name)`), plus a
 * trim so `" Salt "` and `"salt"` promote together. `space_items.name` has no
 * DB-level uniqueness, but the same normalization lets both sources merge.
 */
export function normalizeCustomKey(customName: string | null | undefined): string {
	return (customName ?? '').trim().toLowerCase();
}

/**
 * Which free-text source(s) an op covers: user recipes (`recipe_ingredients`
 * rows with `ingredient_id IS NULL`), shopping-plan items (`space_items`
 * rows with `ingredient_id IS NULL` and a free-text `name`), or both merged
 * by normalized key.
 */
export const customSourceSchema = z.enum(['all', 'recipes', 'plan']).default('all');

export type CustomSource = z.infer<typeof customSourceSchema>;
