import { z } from 'zod';

import { languageKeySchema, type LanguageKey } from '$lib/features/user-settings/consts';

import { canAfford, type CreditUsage } from '../credits.js';
import { OpError } from '../errors.js';
import { defineOp } from '../registry.js';
import {
	buildImportCacheKey,
	getCachedImport,
	getLlmOutput,
	getScrapeStats,
	importRecipeFromUrlCore,
	type ImportUrlResult
} from './import-from-url-helpers.js';

export const importRecipeFromUrlInput = z.object({
	spaceId: z.string(),
	url: z.url(),
	fallbackLang: languageKeySchema
});

export type ImportRecipeFromUrlInput = z.infer<typeof importRecipeFromUrlInput>;

/** Final streamed value: import result + credit usage (the wire shape forms consume). */
export type ImportRecipeFromUrlOutput = ImportUrlResult & { usage: CreditUsage };

/**
 * Imports a recipe from a URL (scrape → enrich → duplicate), charging 1 seed.
 * Moved from `features/recipes/actions/import-from-url.remote.ts:importRecipeFromUrl`
 * + `features/recipes/actions/import-recipe.ts:importRecipeFromUrlCore`.
 *
 * Streams progress numbers, then yields the final `{ id, isComplete, usage }`.
 * The credit gate lives here (not in the adapter): afford-check first, consume
 * once after a successful import — same order as the old remote.
 */
export const importRecipeFromUrlOp = defineOp({
	name: 'recipes.import-from-url',
	domain: 'recipes',
	kind: 'write',
	sync: 'server-only',
	credits: { feature: 'import_recipe_from_website', seeds: 1 },
	input: importRecipeFromUrlInput,
	handler: async function* (ctx, { url, fallbackLang }) {
		if (!(await canAfford(ctx, 1))) {
			throw new OpError('INSUFFICIENT_SEEDS', 'User cannot afford the feature.');
		}
		if (!ctx.admin) {
			throw new OpError('INTERNAL', 'Importing a recipe requires a server context.');
		}

		// Run the credit-free import core, forwarding its progress steps.
		let result: ImportUrlResult | undefined;
		for await (const value of importRecipeFromUrlCore({
			supabase: ctx.supabase,
			admin: ctx.admin,
			userId: ctx.userId,
			url,
			fallbackLang: fallbackLang as LanguageKey
		})) {
			if (typeof value === 'number') {
				yield value;
			} else {
				result = value;
			}
		}

		if (!result) throw new OpError('INTERNAL', 'Import did not complete.');

		// Recompute cache metadata for the credit log after the import.
		const cacheKey = await buildImportCacheKey(url);
		const cache = await getCachedImport(ctx.admin, cacheKey);
		const cacheHit = !!cache && !!getLlmOutput(cache);
		const scrapeStats = getScrapeStats(cache);

		// Same `consume_credits` call `credits.ts:withCredits` makes (SECURITY
		// DEFINER, service_role only → `ctx.admin`), replicated here so progress
		// can stream — `withCredits` would force buffering the whole import.
		const { data, error } = await ctx.admin.rpc('consume_credits', {
			p_amount_to_consume: 1,
			p_source: 'import_recipe_from_website',
			p_user_id: ctx.userId,
			p_metadata: JSON.stringify({
				recipe_url: url,
				cache_hit: cacheHit,
				cache_key: cacheKey,
				strategy: scrapeStats?.strategy ?? null,
				format: scrapeStats?.format ?? null,
				content_length: scrapeStats?.content_length ?? null,
				attempts: scrapeStats?.attempts.length ?? 0
			})
		});
		if (error) {
			throw new OpError('INTERNAL', 'Could not consume credits.', error);
		}

		yield {
			...result,
			usage: {
				privateCreditsUsed: data?.[0].private_credits_consumed,
				publicCreditsUsed: data?.[0].public_credits_consumed
			}
		};
	}
});
