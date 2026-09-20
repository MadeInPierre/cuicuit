import { z } from 'zod';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '$lib/shared/db/supabase.types';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';
import { customSourceSchema, normalizeCustomKey } from './custom-shared.js';
import { requireAdmin } from './require-admin.js';

export const relinkCustomIngredientInput = z.object({
	/** Normalized group key from `ingredients.list-custom` (`lower(trim(custom_name))`). */
	key: z.string().min(1).max(100),
	/** Catalog ingredient the matching rows are relinked to. */
	ingredientId: z.string().uuid(),
	/** Which free-text source(s) to relink. */
	source: customSourceSchema
});

export type RelinkCustomIngredientInput = z.infer<typeof relinkCustomIngredientInput>;

export type RelinkCustomIngredientResult = {
	ingredientId: string;
	key: string;
	/** Rows now pointing at the catalog ingredient, both sources. */
	relinked: number;
	/**
	 * Rows left untouched because their recipe already links this ingredient
	 * (the `(recipe_id, ingredient_id)` unique index would be violated).
	 * The admin resolves those manually on the recipe.
	 */
	skipped: number;
	/** Per-source breakdown of the totals above. */
	recipeRelinked: number;
	recipeSkipped: number;
	planRelinked: number;
	planSkipped: number;
};

/** Bounds the candidate scan; a single key realistically owns far fewer rows. */
const FETCH_CAP = 10000;

type AdminClient = SupabaseClient<Database>;

/** Relinks matching free-text recipe rows; skips recipes already linked. */
async function relinkRecipeRows(
	admin: AdminClient,
	key: string,
	ingredientId: string
): Promise<{ relinked: number; skipped: number }> {
	// PostgREST cannot filter on `lower(trim(custom_name))`, so fetch the
	// custom rows and match in JS. Only `ingredient_id` is written —
	// `custom_name`/`raw_input` stay intact for audit.
	const { data: rows, error: rowsError } = await admin
		.from('recipe_ingredients')
		.select('id, recipe_id, custom_name')
		.is('ingredient_id', null)
		.limit(FETCH_CAP);
	if (rowsError || !rows) {
		throw new OpError('INTERNAL', 'Failed to load custom ingredients.', rowsError);
	}
	const matching = rows.filter((row) => normalizeCustomKey(row.custom_name) === key);
	if (matching.length === 0) return { relinked: 0, skipped: 0 };

	const { data: existing, error: existingError } = await admin
		.from('recipe_ingredients')
		.select('recipe_id')
		.eq('ingredient_id', ingredientId);
	if (existingError || !existing) {
		throw new OpError('INTERNAL', 'Failed to check existing ingredient links.', existingError);
	}
	const linkedRecipes = new Set(existing.map((row) => row.recipe_id));

	const relinkable = matching.filter((row) => !linkedRecipes.has(row.recipe_id));
	if (relinkable.length > 0) {
		const { error: updateError } = await admin
			.from('recipe_ingredients')
			.update({ ingredient_id: ingredientId })
			.in(
				'id',
				relinkable.map((row) => row.id)
			);
		if (updateError) {
			throw new OpError('INTERNAL', 'Failed to relink custom ingredients.', updateError);
		}
	}
	return { relinked: relinkable.length, skipped: matching.length - relinkable.length };
}

/** Relinks matching free-text shopping-plan items (`space_items`). */
async function relinkPlanItems(
	admin: AdminClient,
	key: string,
	ingredientId: string
): Promise<{ relinked: number; skipped: number }> {
	// Same normalization as recipes; `space_items` has no conflicting unique
	// index, so nothing is ever skipped. Only `ingredient_id` is written —
	// `name` stays intact for audit. Soft-deleted rows are left alone.
	const { data: items, error: itemsError } = await admin
		.from('space_items')
		.select('id, name')
		.is('ingredient_id', null)
		.not('name', 'is', null)
		.is('deleted_at', null)
		.limit(FETCH_CAP);
	if (itemsError || !items) {
		throw new OpError('INTERNAL', 'Failed to load custom plan items.', itemsError);
	}
	const matching = items.filter((item) => normalizeCustomKey(item.name) === key);
	if (matching.length > 0) {
		const { error: updateError } = await admin
			.from('space_items')
			.update({ ingredient_id: ingredientId })
			.in(
				'id',
				matching.map((item) => item.id)
			);
		if (updateError) {
			throw new OpError('INTERNAL', 'Failed to relink custom plan items.', updateError);
		}
	}
	return { relinked: matching.length, skipped: 0 };
}

async function relinkCustomIngredientHandler(
	ctx: OpCtx,
	input: RelinkCustomIngredientInput
): Promise<RelinkCustomIngredientResult> {
	const admin = await requireAdmin(ctx);
	const key = normalizeCustomKey(input.key);
	if (!key) {
		throw new OpError('VALIDATION', 'Custom ingredient key must not be blank.');
	}

	const { data: ingredient, error: ingredientError } = await admin
		.from('ingredients')
		.select('id')
		.eq('id', input.ingredientId)
		.maybeSingle();
	if (ingredientError) {
		throw new OpError('INTERNAL', 'Failed to load ingredient.', ingredientError);
	}
	if (!ingredient) {
		throw new OpError('NOT_FOUND', 'Ingredient not found.');
	}

	// Idempotent per source: re-running after a promote (or racing it) is a
	// no-op, never an error — so double-promote cannot corrupt anything.
	const recipes =
		input.source !== 'plan' ? await relinkRecipeRows(admin, key, input.ingredientId) : { relinked: 0, skipped: 0 };
	const plan =
		input.source !== 'recipes' ? await relinkPlanItems(admin, key, input.ingredientId) : { relinked: 0, skipped: 0 };

	return {
		ingredientId: input.ingredientId,
		key,
		relinked: recipes.relinked + plan.relinked,
		skipped: recipes.skipped + plan.skipped,
		recipeRelinked: recipes.relinked,
		recipeSkipped: recipes.skipped,
		planRelinked: plan.relinked,
		planSkipped: plan.skipped
	};
}

/**
 * `ingredients.relink-custom` — admin-only: points every free-text row whose
 * normalized name equals `key` at an existing catalog ingredient (the second
 * half of promote-after-create, or the whole "link to existing" flow).
 * Covers recipe rows and/or shopping-plan items — see `source`. Recipe rows
 * whose recipe already links the ingredient are skipped (unique index) and
 * reported, never deleted. Idempotent: unknown/already-promoted keys return
 * zero counts.
 */
export const relinkCustomIngredientOp = defineOp({
	name: 'ingredients.relink-custom',
	domain: 'ingredients',
	kind: 'write',
	sync: 'server-only',
	docs: {
		title: 'Relink custom ingredients to a catalog row (admin)',
		description:
			'Admin-only: relinks free-text recipe and/or shopping-plan rows matching a normalized custom name to a catalog ingredient. Idempotent; conflicting rows are skipped and reported.',
	},
	input: relinkCustomIngredientInput,
	internal: true,
	handler: relinkCustomIngredientHandler
});
