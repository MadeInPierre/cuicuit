import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import type { Database } from '$lib/shared/db/supabase.types';
import { languageCodeSchema } from '$lib/shared/language.js';

import { OpError } from '../errors.js';
import { resolveLanguageId } from '../languages/resolve.js';
import { defineOp } from '../registry.js';

/** Columns filterable via `overlaps`/`in`. Mirrors the DB enum/array columns
 * exposed by the recipe library UI. Enforced here (not just in the REST
 * adapter) so app, API and MCP share the same allowlist — see M6 hardening. */
export const RECIPE_FILTER_COLUMNS = [
	'times_of_day',
	'courses',
	'cuisines',
	'effort_level',
	'cleanup_level',
	'skill_level',
	'cost_level'
] as const;

/** Columns addressable inside the `or` filter expression. */
export const RECIPE_OR_COLUMNS = [
	'time_total_minutes',
	'time_prep_minutes',
	'time_cook_minutes',
	'time_rest_minutes'
] as const;

const listFilterSchema = z.object({
	column: z.enum(RECIPE_FILTER_COLUMNS),
	values: z.array(z.string()).min(1)
});

/**
 * Validates a PostgREST `or` expression: every `column.operator.` segment must
 * reference an allowlisted column with a supported operator. Rejects anything
 * else (including empty expressions) so raw user input can never reach `.or()`.
 */
export function assertValidOrFilter(raw: string): void {
	if (!/^[\w().,]+$/.test(raw)) throw new OpError('VALIDATION', 'Invalid `or` filter.');
	const re = /([A-Za-z_][A-Za-z0-9_]*)\.(gte|lte|eq|neq|like|ilike|in|is)\./g;
	let m: RegExpExecArray | null;
	let found = false;
	while ((m = re.exec(raw)) !== null) {
		found = true;
		if (!(RECIPE_OR_COLUMNS as readonly string[]).includes(m[1])) {
			throw new OpError('VALIDATION', 'Invalid column in `or` filter.');
		}
	}
	if (!found) throw new OpError('VALIDATION', 'Invalid `or` filter.');
}

export type ListRecipesFilter = z.infer<typeof listFilterSchema>;

export const listRecipesInput = z.object({
	lang: languageCodeSchema,
	searchText: z.string().default(''),
	limit: z.number().int().min(1).max(500).default(100),
	overlaps: z.array(listFilterSchema).default([]),
	in: z.array(listFilterSchema).default([]),
	// Validated in-core (not just at the REST boundary) so MCP + app paths
	// share the same allowlist — raw input never reaches `.or()`.
	or: z
		.string()
		.nullable()
		.default(null)
		.refine(
			(v) => {
				if (v === null) return true;
				try {
					assertValidOrFilter(v);
					return true;
				} catch {
					return false;
				}
			},
			{ message: 'Invalid `or` filter.' }
		)
});

export type ListRecipesInput = z.infer<typeof listRecipesInput>;

// Narrow projections (not `*`): `ingredients.embedding` (1024-dim vector ≈ 4KB/row
// — already excluded from the ingredient list below) and
// `ingredient_translations.fts` (tsvector) are never read by the app, and
// `languages` is only ever read as `.lang` here — fetching them on every
// recipe × ingredient × translation row was the bulk of Supabase egress.
const RECIPES_DETAILED_SELECT = `*,
			language:languages(lang),
			ingredients:recipe_ingredients(
				*,
				ingredient:ingredients(
					id, slug, slug_general, aisle, hierarchy, base_unit, unit_frequencies, g_per_unit, g_per_ml,
					translations:ingredient_translations(ingredient_id, language_id, name_singular, name_plural, name_general, commonly_used, language:languages!inner(lang))
				)
			)`;

/**
 * Shared with the thin `get-recipe-detailed.ts` adapter so its exported row
 * types stay identical. Filters callers used to chain (`.limit()`,
 * `.overlaps()`, `.in()`, `.or()`) are applied by the op from `input` now.
 */
export function recipesDetailedQuery(
	client: SupabaseClient<Database>,
	languageId: number,
	searchText?: string
) {
	let query = client
		.from('recipes_randomized')
		.select(RECIPES_DETAILED_SELECT)
		.eq('ingredients.ingredient.translations.language_id', languageId) // Only get translations in the user language
		.is('deleted_at', null);

	if (searchText) {
		// Remove accents from searchText for accent-insensitive search
		const normalizedSearchText = searchText
			.trim()
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '');
		query = query.ilike('search_term', `%${normalizedSearchText}%`);
	}

	return query;
}

export type RecipeDetailedRow = NonNullable<
	Awaited<ReturnType<typeof recipesDetailedQuery>>['data']
>[number];

/**
 * Applies the caller-chained list filters (`.limit()`, `.overlaps()`, `.in()`,
 * `.or()`) to a recipe list query. Shared with `list-cards.ts` so both list
 * ops filter identically — the column allowlist lives in `listRecipesInput`.
 */
export function applyRecipeListFilters<
	Q extends {
		overlaps: (column: string, values: string[]) => Q;
		in: (column: string, values: string[]) => Q;
		or: (filters: string) => Q;
	}
>(
	query: Q,
	{
		overlaps,
		in: inFilters,
		or: orFilter
	}: { overlaps: ListRecipesFilter[]; in: ListRecipesFilter[]; or: string | null }
): Q {
	// PostgREST filters are runtime strings — the column allowlist is enforced
	// by the zod schema above, so widen back to `string` for the builder's
	// overloads (the literal union would demand per-column value types).
	for (const filter of overlaps) {
		query = query.overlaps(filter.column as string, filter.values);
	}
	for (const filter of inFilters) {
		query = query.in(filter.column as string, filter.values);
	}
	if (orFilter) {
		query = query.or(orFilter);
	}
	return query;
}

/**
 * Lists detailed recipes (language-filtered translations, ingredients).
 * Moved from `features/recipes/queries/get-recipe-detailed.ts:getRecipesDetailed`.
 */
export const listRecipesOp = defineOp({
	name: 'recipes.list',
	domain: 'recipes',
	kind: 'read',
	sync: 'synced',
	docs: {
		title: 'List recipes',
		description:
			'Lists detailed recipes with language-filtered translations and ingredients. Takes `lang` (e.g. `en-US`).',
		tool: 'recipes_list'
	},
	input: listRecipesInput,
	handler: async (ctx, { lang, searchText, limit, overlaps, in: inFilters, or: orFilter }) => {
		const { id: languageId } = await resolveLanguageId(ctx.supabase, lang);
		const query = applyRecipeListFilters(
			recipesDetailedQuery(ctx.supabase, languageId, searchText).limit(limit),
			{ overlaps, in: inFilters, or: orFilter }
		);

		const { data, error } = await query;
		if (error) {
			throw new OpError('INTERNAL', 'Failed to list recipes.', error);
		}
		return data ?? [];
	}
});

export type ListRecipesOutput = RecipeDetailedRow[];
