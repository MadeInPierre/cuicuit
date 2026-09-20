import {
	aisleSchema,
	baseUnitSchema,
	commonlyUsedSchema,
	substitutionStrengthSchema
} from '$lib/core/operations/ingredients/admin-schemas.js';

/**
 * UI constants for the admin ingredient dashboard.
 * Options are derived from the M1 zod enums (single source of truth) so the
 * UI can never offer a value the ops would reject.
 */
export const AISLE_OPTIONS = aisleSchema.options;
export const BASE_UNIT_OPTIONS = baseUnitSchema.options;
export const COMMONLY_USED_OPTIONS = commonlyUsedSchema.options;
export const SUBSTITUTION_STRENGTH_OPTIONS = substitutionStrengthSchema.options;

export type Aisle = (typeof AISLE_OPTIONS)[number];
export type BaseUnit = (typeof BASE_UNIT_OPTIONS)[number];
export type CommonlyUsed = (typeof COMMONLY_USED_OPTIONS)[number];
export type SubstitutionStrength = (typeof SUBSTITUTION_STRENGTH_OPTIONS)[number];

/**
 * Select-component sentinel for "no aisle" (bits-ui `Select.Root` values are
 * strings, so nullable fields need an explicit none-option).
 */
export const NO_AISLE = '__none';

/**
 * Suggest a valid `^[a-z0-9-]+$` slug for a free-text custom name
 * (`" Fleur de Sel "` → `"fleur-de-sel"`). Mirrors the DB slug CHECK so the
 * promote wizard prefills something the create op accepts.
 */
export function slugifyCustomName(name: string): string {
	return name
		.trim()
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-{2,}/g, '-');
}
