import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';
import { customSourceSchema, normalizeCustomKey } from './custom-shared.js';
import { requireAdmin } from './require-admin.js';

export const listCustomIngredientsInput = z.object({
	/** Max groups returned, most frequent first. */
	limit: z.number().int().min(1).max(500).default(200),
	/** Which free-text source(s) to cover. */
	source: customSourceSchema
});

export type ListCustomIngredientsInput = z.infer<typeof listCustomIngredientsInput>;

export type CustomIngredientSample = {
	recipeId: string;
	title: string;
	lang: string | null;
};

export type CustomIngredientPlanSample = {
	spaceId: string;
	name: string;
	lang: string | null;
};

export type CustomIngredientGroup = {
	/** Normalized grouping key: `lower(trim(custom_name))`. */
	key: string;
	/** First-seen trimmed casing, for display and promote prefill. */
	sample: string;
	/** Total rows across the selected sources. */
	count: number;
	/** Rows from `recipe_ingredients`. */
	recipeCount: number;
	/** Rows from `space_items`. */
	planCount: number;
	/** Up to 5 distinct raw inputs behind this key (recipes only). */
	rawInputs: string[];
	/** Up to 5 sample recipes (for the UI detail view). */
	recipes: CustomIngredientSample[];
	/** Up to 5 sample shopping-plan spaces (for the UI detail view). */
	spaces: CustomIngredientPlanSample[];
	/** Distinct languages behind this key, both sources merged. */
	langs: string[];
};

export type ListCustomIngredientsResult = CustomIngredientGroup[];

/**
 * Row cap for the underlying fetch: grouping happens in JS (PostgREST has no
 * GROUP BY without an RPC), so this bounds memory. Counts are exact up to the
 * cap; beyond it they are a lower bound and the docs say so.
 */
const FETCH_CAP = 10000;
const SAMPLE_CAP = 5;

async function listCustomIngredientsHandler(
	ctx: OpCtx,
	input: ListCustomIngredientsInput
): Promise<ListCustomIngredientsResult> {
	const admin = await requireAdmin(ctx);
	const withRecipes = input.source !== 'plan';
	const withPlan = input.source !== 'recipes';

	const groups = new Map<string, CustomIngredientGroup>();
	const getGroup = (key: string, fallbackSample: string): CustomIngredientGroup => {
		let group = groups.get(key);
		if (!group) {
			group = {
				key,
				sample: fallbackSample,
				count: 0,
				recipeCount: 0,
				planCount: 0,
				rawInputs: [],
				recipes: [],
				spaces: [],
				langs: []
			};
			groups.set(key, group);
		}
		return group;
	};
	const pushLang = (group: CustomIngredientGroup, lang: string | null | undefined) => {
		if (lang && !group.langs.includes(lang)) group.langs.push(lang);
	};

	if (withRecipes) {
		const { data: rows, error } = await admin
			.from('recipe_ingredients')
			.select('custom_name, raw_input, recipe_id, recipe:recipes!inner(title, language:languages!inner(lang))')
			.is('ingredient_id', null)
			.limit(FETCH_CAP);
		if (error || !rows) {
			throw new OpError('INTERNAL', 'Failed to list custom recipe ingredients.', error);
		}
		for (const row of rows) {
			const key = normalizeCustomKey(row.custom_name);
			if (!key) continue;
			const group = getGroup(key, row.custom_name?.trim() ?? key);
			group.count += 1;
			group.recipeCount += 1;
			const raw = row.raw_input?.trim();
			if (raw && !group.rawInputs.includes(raw) && group.rawInputs.length < SAMPLE_CAP) {
				group.rawInputs.push(raw);
			}
			if (group.recipes.length < SAMPLE_CAP && !group.recipes.some((r) => r.recipeId === row.recipe_id)) {
				group.recipes.push({
					recipeId: row.recipe_id,
					title: row.recipe.title,
					lang: row.recipe.language?.lang ?? null
				});
			}
			pushLang(group, row.recipe.language?.lang);
		}
	}

	if (withPlan) {
		// Free-text shopping-plan items: no catalog link, a name, not soft-deleted.
		const { data: items, error } = await admin
			.from('space_items')
			.select('name, space_id, space:spaces!inner(name, language:languages!inner(lang))')
			.is('ingredient_id', null)
			.not('name', 'is', null)
			.is('deleted_at', null)
			.limit(FETCH_CAP);
		if (error || !items) {
			throw new OpError('INTERNAL', 'Failed to list custom plan items.', error);
		}
		for (const item of items) {
			const key = normalizeCustomKey(item.name);
			if (!key) continue;
			const group = getGroup(key, item.name?.trim() ?? key);
			group.count += 1;
			group.planCount += 1;
			if (group.spaces.length < SAMPLE_CAP && !group.spaces.some((s) => s.spaceId === item.space_id)) {
				group.spaces.push({
					spaceId: item.space_id,
					name: item.space.name,
					lang: item.space.language?.lang ?? null
				});
			}
			pushLang(group, item.space.language?.lang);
		}
	}

	return [...groups.values()]
		.sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
		.slice(0, input.limit);
}

/**
 * `ingredients.list-custom` — admin-only: groups user-created free-text
 * ingredients by normalized `lower(trim(...))` name, most frequent first.
 * Covers recipe rows (`recipe_ingredients` with `ingredient_id IS NULL`),
 * shopping-plan items (`space_items` with `ingredient_id IS NULL` and a
 * free-text `name`), or both merged — see `source`. Feeds the "Custom items"
 * admin tab; promoting a group goes through `ingredients.create` (or links an
 * existing ingredient) + `ingredients.relink-custom`.
 */
export const listCustomIngredientsOp = defineOp({
	name: 'ingredients.list-custom',
	domain: 'ingredients',
	kind: 'read',
	sync: 'server-only',
	docs: {
		title: 'List custom free-text ingredients (admin)',
		description:
			'Admin-only: most common user-created free-text ingredients from recipes and/or the shopping plan, grouped by normalized name. Counts are exact up to 10000 underlying rows per source.',
	},
	input: listCustomIngredientsInput,
	internal: true,
	handler: listCustomIngredientsHandler
});
