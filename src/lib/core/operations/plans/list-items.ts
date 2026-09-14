import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import type { Database } from '$lib/shared/db/supabase.types';
import { languageCodeSchema } from '$lib/shared/language.js';

import { OpError } from '../errors.js';
import { resolveLanguageId } from '../languages/resolve.js';
import { defineOp } from '../registry.js';

export const listItemsInput = z.object({
	spaceId: z.string().min(1),
	lang: languageCodeSchema
});

export type ListItemsInput = z.infer<typeof listItemsInput>;

const ITEMS_SELECT = `*,
				author_profile:user_public_profiles(*),
				ingredient:ingredients!ingredient_id(
					id, slug, slug_general, aisle, hierarchy, base_unit, unit_frequencies, g_per_unit, g_per_ml,
					translations:ingredient_translations(
						*,
						language:languages!language_id(lang)
					)
				)`;

/** Shared with the thin `get-plan-items.ts` adapter so its exported row types stay identical. */
export function itemsQuery(client: SupabaseClient<Database>, spaceId: string, languageId: number) {
	return client
		.from('space_items')
		.select(ITEMS_SELECT)
		.eq('space_id', spaceId)
		.eq('ingredient.translations.language_id', languageId)
		.is('deleted_at', null)
		.order('updated_at', { ascending: false });
}

export type PlanItemRow = NonNullable<Awaited<ReturnType<typeof itemsQuery>>['data']>[number];

/**
 * Lists the non-deleted shopping items of a space, newest first.
 * Moved from `features/plans/queries/get-plan-items.ts` (the `.is('deleted_at', null)`
 * filter callers used to chain is applied here now).
 */
export const listItemsOp = defineOp({
	name: 'plans.list-items',
	domain: 'plans',
	kind: 'read',
	sync: 'synced',
	docs: {
		title: 'List shopping items',
		description:
			'Lists the non-deleted shopping items of a space, newest first. Takes `lang` (e.g. `en-US`). Items have `type`: `"meal"` (created by plan_add_recipe, linked to a meal) or `"independent"` (standalone, from shopping_add). Combine with plan_list (meals) for the full picture.',
		tool: 'shopping_list'
	},
	input: listItemsInput,
	handler: async (ctx, { spaceId, lang }) => {
		const { id: languageId } = await resolveLanguageId(ctx.supabase, lang);
		const { data, error } = await itemsQuery(ctx.supabase, spaceId, languageId);
		if (error) {
			throw new OpError('INTERNAL', 'Failed to list shopping items.', error);
		}
		return data ?? [];
	}
});

export type ListItemsOutput = PlanItemRow[];
