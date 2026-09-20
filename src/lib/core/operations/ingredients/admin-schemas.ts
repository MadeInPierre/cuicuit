import { z } from 'zod';

/**
 * Shared zod fragments for the admin ingredient ops (M1).
 *
 * They mirror the table CHECKs in `supabase/schemas/40_ingredients.sql` so
 * invalid input fails fast with a ZodError before touching the DB:
 * - slugs match `^[a-z0-9-]+$` (`ingredients_check`)
 * - translation names must be non-empty when provided
 *   (`ingredient_translations_check`)
 * - substitution ratio must be > 0
 *   (`ingredient_substitutions_original_to_substitute_ratio_check`)
 */

export const slugSchema = z
	.string()
	.regex(/^[a-z0-9-]+$/, 'Slug must match ^[a-z0-9-]+$.')
	.max(50);

export const aisleSchema = z.enum([
	'beverages',
	'bread-pastries',
	'care-health',
	'frozen-convenience',
	'fruits-vegetables',
	'grain-products',
	'home-garden',
	'household',
	'ingredients-spices',
	'meat-fish',
	'milk-cheese',
	'pet-supplies',
	'snacks-sweets',
	'unknown'
]);

export const baseUnitSchema = z.enum(['g', 'ml', 'unit']);

export const commonlyUsedSchema = z.enum(['daily', 'common', 'occasionally', 'rare', 'never']);

export const substitutionStrengthSchema = z.enum(['equivalent', 'close', 'far', 'variant']);

/** `jsonb` unit maps (`unit_frequencies`, `g_per_unit`): `{ unit: number }` or null. */
export const unitMapSchema = z.record(z.string(), z.number()).nullable().optional();

/** Writable base-table fields for create (all required except where the DB allows null). */
export const ingredientBaseFields = z.object({
	slug: slugSchema,
	slugGeneral: slugSchema,
	aisle: aisleSchema.nullable().default(null),
	hierarchy: z.array(z.string()).default([]),
	baseUnit: baseUnitSchema,
	unitFrequencies: unitMapSchema,
	gPerUnit: unitMapSchema,
	gPerMl: z.number().positive().nullable().optional()
});

export type IngredientBaseFields = z.infer<typeof ingredientBaseFields>;

/**
 * Partial patch for update — at least one field must be present (enforced in
 * the op). Declared independently from `ingredientBaseFields` (not
 * `.partial()`): partial preserves the create defaults (`aisle: null`,
 * `hierarchy: []`), which would make an empty patch look non-empty.
 */
export const ingredientPatchFields = z.object({
	slug: slugSchema.optional(),
	slugGeneral: slugSchema.optional(),
	aisle: aisleSchema.nullable().optional(),
	hierarchy: z.array(z.string()).optional(),
	baseUnit: baseUnitSchema.optional(),
	unitFrequencies: unitMapSchema,
	gPerUnit: unitMapSchema,
	gPerMl: z.number().positive().nullable().optional()
});

export type IngredientPatchFields = z.infer<typeof ingredientPatchFields>;
