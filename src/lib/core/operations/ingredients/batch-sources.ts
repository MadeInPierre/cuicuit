import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '$lib/shared/db/supabase.types';

import { OpError } from '../errors.js';
import type { BatchSource } from './batch-tasks.js';

/**
 * Loads batch source texts for a set of ingredients (M4, server-only).
 *
 * Source language: `en-US` when present, else the first available
 * translation. Ingredients without ANY translation are skipped (reported to
 * the caller so the UI can show "3 skipped — no source text").
 */
export async function loadBatchSources(
	admin: SupabaseClient<Database>,
	ingredientIds: string[]
): Promise<{ sources: BatchSource[]; skipped: string[] }> {
	if (ingredientIds.length === 0) return { sources: [], skipped: [] };

	const { data: rows, error } = await admin
		.from('ingredients')
		.select('id, slug, slug_general, aisle')
		.in('id', ingredientIds);
	if (error) throw new OpError('INTERNAL', 'Failed to load ingredients for batch.', error);

	const { data: translations, error: tError } = await admin
		.from('ingredient_translations')
		.select('ingredient_id, name_singular, name_plural, name_general, commonly_used, language:languages!inner(lang)')
		.in('ingredient_id', ingredientIds);
	if (tError) throw new OpError('INTERNAL', 'Failed to load translations for batch.', tError);

	const byIngredient = new Map<string, typeof translations>();
	for (const t of translations ?? []) {
		const list = byIngredient.get(t.ingredient_id) ?? [];
		list.push(t);
		byIngredient.set(t.ingredient_id, list);
	}

	const sources: BatchSource[] = [];
	const skipped: string[] = [];
	for (const row of rows ?? []) {
		const list = byIngredient.get(row.id) ?? [];
		if (list.length === 0) {
			skipped.push(row.id);
			continue;
		}
		const en = list.find((t) => (t.language as unknown as { lang: string })?.lang === 'en-US');
		const ref = en ?? list[0];
		sources.push({
			ingredientId: row.id,
			slug: row.slug,
			slugGeneral: row.slug_general,
			aisle: row.aisle,
			sourceNameSingular: ref.name_singular,
			sourceNamePlural: ref.name_plural,
			sourceNameGeneral: ref.name_general,
			sourceCommonlyUsed: ref.commonly_used
		});
	}
	// Requested ids that don't exist at all are also "skipped", never an error
	// (the UI's select-all snapshot can go stale while an admin deletes rows).
	const found = new Set((rows ?? []).map((r) => r.id));
	for (const id of ingredientIds) {
		if (!found.has(id) && !skipped.includes(id)) skipped.push(id);
	}
	return { sources, skipped };
}
