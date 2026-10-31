import { publicRecipesRowSchema } from '$lib/shared/db/supazod.schemas';
import { z } from 'zod';

/**
 * Progress events streamed by the recipe import ops.
 *
 * Client-safe: no server imports. The final result is a plain
 * `{ id, isComplete }` object with no `kind`, so `isImportProgress` cleanly
 * separates progress from the result.
 */

/**
 * Enriched recipe metadata (everything except steps). Single source shared by
 * the streaming LLM output schema (server) and the `metadata` partial patch
 * (client preview).
 */
export const importMetadataSchema = z.object({
	title: publicRecipesRowSchema.shape.title
		.catch('My Recipe')
		.describe('Original title but without useless SEO text, e.g. "the best", "easy", etc.'),
	short_title: publicRecipesRowSchema.shape.short_title
		.catch('Recipe')
		.describe('Shortest possible title for this recipe in 1 word.'),
	description: publicRecipesRowSchema.shape.description
		.catch(null)
		.describe('1-2 sentence short description.'),
	servings: z.coerce.number().catch(4),
	time_prep_minutes: z.coerce.number().nullable().catch(null),
	time_cook_minutes: z.coerce.number().nullable().catch(null),
	time_rest_minutes: z.coerce.number().nullable().catch(null),
	cleanup_level: publicRecipesRowSchema.shape.cleanup_level.catch('none'),
	cost_level: publicRecipesRowSchema.shape.cost_level.catch('budget'),
	skill_level: publicRecipesRowSchema.shape.skill_level.catch('beginner'),
	effort_level: publicRecipesRowSchema.shape.effort_level.catch('low'),
	courses: publicRecipesRowSchema.shape.courses.catch(['main']),
	cuisines: publicRecipesRowSchema.shape.cuisines.catch([]),
	times_of_day: publicRecipesRowSchema.shape.times_of_day.catch([]),
	tools: publicRecipesRowSchema.shape.tools.catch([]),
	notes: publicRecipesRowSchema.shape.notes.catch(null)
});

export type ImportMetadata = z.infer<typeof importMetadataSchema>;

/** One ingredient as shown in the import preview (raw LLM name, or matched catalog ingredient). */
export type ImportIngredientPreview = {
	name: string;
	amount: number;
	/** Regionized unit key, same as the stored recipe row. */
	unit: string;
	isOptional: boolean;
	/** Catalog ingredient id, null for unmatched/custom ingredients (no image). */
	ingredientId: string | null;
};

/** One step as shown in the import preview (text + timer only, no ingredient highlighting). */
export type ImportStepPreview = {
	text: string;
	timer_minutes: number | null;
	temperature_amount: number | null;
	temperature_unit: 'C' | 'F' | null;
};

/**
 * Chunky streaming patch, emitted once per section as the single LLM
 * completion streams: metadata (title/description/filters) -> ingredients ->
 * steps. A `matched` patch may follow `ingredients` once catalog matching
 * (run concurrently with steps generation) completes.
 */
export type ImportPartialPatch =
	| { section: 'metadata'; lang: string | null; metadata: ImportMetadata }
	| { section: 'ingredients'; ingredients: ImportIngredientPreview[] }
	| { section: 'matched'; ingredients: ImportIngredientPreview[] }
	| { section: 'steps'; steps: ImportStepPreview[] };

export type ImportStep = { kind: 'step'; step: number };

/** Emitted once the recipe id exists and the page can be shown. */
export type ImportDraft = { kind: 'draft'; recipeId: string; title: string | null };

/** Emitted as soon as the source image is uploaded to storage (blurred preview). */
export type ImportImage = { kind: 'image'; imageId: string };

export type ImportPartial = { kind: 'partial'; patch: ImportPartialPatch };

export type ImportProgress = ImportStep | ImportDraft | ImportImage | ImportPartial;

export function isImportProgress(value: unknown): value is ImportProgress {
	if (typeof value !== 'object' || value === null) return false;
	const kind = (value as { kind?: unknown }).kind;
	return kind === 'step' || kind === 'draft' || kind === 'image' || kind === 'partial';
}
