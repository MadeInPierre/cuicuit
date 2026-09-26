import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '$lib/shared/db/supabase.types';

import { OpError } from '../errors.js';
import { resolveLanguageId } from '../languages/resolve.js';
import { defineOp } from '../registry.js';
import { applyRecipeListFilters, listRecipesInput, type ListRecipesInput } from './list.js';

/** Card listing takes exactly the same filters as the detailed listing. */
export type ListRecipeCardsInput = ListRecipesInput;

// Card-level projection: everything the recipe cards render (library grid,
// search results) and nothing else — no steps/notes/descriptions, no
// times/levels/tools, no recipe language join. The single ingredient join
// exists only for the no-image mosaic (`RecipeImage` renders up to 6
// ingredient thumbnails + names): just ids, quantities for sorting, and
// display names in the user language.
const RECIPES_CARD_SELECT = `id, title, servings, effort_level, time_total_minutes, image_ids, source_url, times_of_day, cuisines, courses,
			ingredients:recipe_ingredients(
				id, custom_name, quantity, is_optional,
				ingredient:ingredients(
					id,
					translations:ingredient_translations(name_singular, name_plural, language:languages!inner(lang))
				)
			)`;

/**
 * Shared with the thin `get-recipe-detailed.ts` adapter so its exported row
 * types stay identical. Same language filtering + soft-delete + search
 * semantics as `recipesDetailedQuery`, card projection only.
 */
export function recipesCardQuery(
	client: SupabaseClient<Database>,
	languageId: number,
	searchText?: string
) {
	let query = client
		.from('recipes_randomized')
		.select(RECIPES_CARD_SELECT)
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

export type RecipeCardRow = NonNullable<
	Awaited<ReturnType<typeof recipesCardQuery>>['data']
>[number];

/**
 * Lists minimal recipe cards for browsing (library grid, search-as-you-type).
 * Same filters as `recipes.list`, a fraction of the egress: reach for
 * `recipes.get` when a dedicated page needs the full recipe.
 */
export const listRecipeCardsOp = defineOp({
	name: 'recipes.list-cards',
	domain: 'recipes',
	kind: 'read',
	sync: 'synced',
	docs: {
		title: 'List recipe cards',
		description:
			'Lists minimal recipe cards (id, title, servings, times, image, groupings, fallback ingredient names) with language-filtered display names. For browsing only — takes `lang` (e.g. `en-US`); use `recipes_get` for a full recipe.',
		tool: 'recipes_list_cards'
	},
	input: listRecipesInput,
	handler: async (ctx, { lang, searchText, limit, overlaps, in: inFilters, or: orFilter }) => {
		const { id: languageId } = await resolveLanguageId(ctx.supabase, lang);
		const query = applyRecipeListFilters(
			recipesCardQuery(ctx.supabase, languageId, searchText).limit(limit),
			{ overlaps, in: inFilters, or: orFilter }
		);

		const { data, error } = await query;
		if (error) {
			throw new OpError('INTERNAL', 'Failed to list recipe cards.', error);
		}
		return data ?? [];
	}
});

export type ListRecipeCardsOutput = RecipeCardRow[];
