import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import type { Database } from '$lib/shared/db/supabase.types';
import { languageCodeSchema } from '$lib/shared/language.js';

import { OpError } from '../errors.js';
import { resolveLanguageId } from '../languages/resolve.js';
import { defineOp } from '../registry.js';

export const listMealsInput = z.object({
	spaceId: z.string().min(1),
	lang: languageCodeSchema
});

export type ListMealsInput = z.infer<typeof listMealsInput>;

const MEALS_SELECT = `*,
				recipe:recipes(
					*,
					language:languages(*),
					recipe_ingredients(*)
				),
				shopping_ingredients:space_items(
					*,
					author_profile:user_public_profiles(*),
					ingredient:ingredients(
						id, slug, slug_general, aisle, hierarchy, base_unit, unit_frequencies, g_per_unit, g_per_ml,
						translations:ingredient_translations(
							*,
							language:languages(lang)
						)
					)
				)`;

/** Shared with the thin `get-plan-meals.ts` adapter so its exported row types stay identical. */
export function mealsQuery(client: SupabaseClient<Database>, spaceId: string, languageId: number) {
	return client
		.from('space_meals')
		.select(MEALS_SELECT)
		.eq('space_id', spaceId)
		.eq('shopping_ingredients.ingredient.translations.language_id', languageId)
		.is('deleted_at', null);
}

export type PlanMealRow = NonNullable<Awaited<ReturnType<typeof mealsQuery>>['data']>[number];
export type ShoppingIngredient = PlanMealRow['shopping_ingredients'][number];

/**
 * Lists the non-deleted meals of a space with their recipes and shopping ingredients.
 * Moved from `features/plans/queries/get-plan-meals.ts` (the `.is('deleted_at', null)`
 * filter callers used to chain is applied here now).
 */
export const listMealsOp = defineOp({
	name: 'plans.list-meals',
	domain: 'plans',
	kind: 'read',
	sync: 'synced',
	docs: {
		title: 'List meals',
		description:
			'Lists the non-deleted meals of a space with recipes and shopping ingredients. Takes `lang` (e.g. `en-US`). Each meal carries its `recipe` (with `servings` and `recipe_ingredients`) plus its linked `shopping_ingredients` items.',
		tool: 'plan_list'
	},
	input: listMealsInput,
	handler: async (ctx, { spaceId, lang }) => {
		const { id: languageId } = await resolveLanguageId(ctx.supabase, lang);
		const { data, error } = await mealsQuery(ctx.supabase, spaceId, languageId);
		if (error) {
			throw new OpError('INTERNAL', 'Failed to list plan meals.', error);
		}
		return data ?? [];
	}
});

export type ListMealsOutput = PlanMealRow[];
