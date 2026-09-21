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
 *
 * Order guarantee: sources follow the INPUT id order (deduped), never DB
 * return order — `batch-submit` and `batch-status` must rebuild identical
 * groups, and Postgres without ORDER BY makes no such promise.
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

	return assembleBatchSources(rows ?? [], translations ?? [], ingredientIds);
}

interface BatchIngredientRow {
	id: string;
	slug: string;
	slug_general: string;
	aisle: string | null;
}

interface BatchTranslationRow {
	ingredient_id: string;
	name_singular: string | null;
	name_plural: string | null;
	name_general: string;
	commonly_used: string | null;
	language: { lang: string } | { lang: string }[] | null;
}

/**
 * Pure assembly step of `loadBatchSources` (unit-testable, no DB): matches
 * rows to the requested ids IN INPUT ORDER. Unknown ids (deleted after
 * selection) count as skipped, never an error.
 */
export function assembleBatchSources(
	rows: BatchIngredientRow[],
	translations: BatchTranslationRow[],
	orderedIds: string[]
): { sources: BatchSource[]; skipped: string[] } {
	const byId = new Map(rows.map((r) => [r.id, r]));
	const byIngredient = new Map<string, BatchTranslationRow[]>();
	for (const t of translations) {
		const list = byIngredient.get(t.ingredient_id) ?? [];
		list.push(t);
		byIngredient.set(t.ingredient_id, list);
	}
	const langOf = (t: BatchTranslationRow): string | null => {
		const lang = t.language;
		if (!lang) return null;
		return Array.isArray(lang) ? (lang[0]?.lang ?? null) : (lang.lang ?? null);
	};

	const sources: BatchSource[] = [];
	const skipped: string[] = [];
	const seen = new Set<string>();
	for (const id of orderedIds) {
		if (seen.has(id)) continue;
		seen.add(id);
		const row = byId.get(id);
		const list = byIngredient.get(id) ?? [];
		if (!row || list.length === 0) {
			skipped.push(id);
			continue;
		}
		const ref = list.find((t) => langOf(t) === 'en-US') ?? list[0];
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
	return { sources, skipped };
}
