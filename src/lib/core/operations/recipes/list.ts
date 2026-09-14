import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import type { Database } from '$lib/shared/db/supabase.types';
import { languageCodeSchema } from '$lib/shared/language.js';

import { OpError } from '../errors.js';
import { resolveLanguageId } from '../languages/resolve.js';
import { defineOp } from '../registry.js';

const listFilterSchema = z.object({
	column: z.string().min(1),
	values: z.array(z.string()).min(1)
});

export type ListRecipesFilter = z.infer<typeof listFilterSchema>;

export const listRecipesInput = z.object({
	lang: languageCodeSchema,
	searchText: z.string().default(''),
	limit: z.number().int().min(1).max(500).default(100),
	overlaps: z.array(listFilterSchema).default([]),
	in: z.array(listFilterSchema).default([]),
	or: z.string().nullable().default(null)
});

export type ListRecipesInput = z.infer<typeof listRecipesInput>;

const RECIPES_DETAILED_SELECT = `*,
			language:languages(*),
			ingredients:recipe_ingredients(
				*,
				ingredient:ingredients(
					id, slug, slug_general, aisle, hierarchy, base_unit, unit_frequencies, g_per_unit, g_per_ml,
					translations:ingredient_translations(*, language:languages!inner(lang))
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
		.is('deleted_at', null)
		.not('author_id', 'is', null); // Hide author-less cache template recipes from the library (RLS forbids anyway)

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
		let query = recipesDetailedQuery(ctx.supabase, languageId, searchText).limit(limit);

		for (const filter of overlaps) {
			query = query.overlaps(filter.column, filter.values);
		}
		for (const filter of inFilters) {
			query = query.in(filter.column, filter.values);
		}
		if (orFilter) {
			query = query.or(orFilter);
		}

		const { data, error } = await query;
		if (error) {
			throw new OpError('INTERNAL', 'Failed to list recipes.', error);
		}
		return data ?? [];
	}
});

export type ListRecipesOutput = RecipeDetailedRow[];
