import { getRequestEvent, query } from '$app/server';
import { canUserAfford } from '$lib/features/auth/queries/get-user-credit-balance';
import { FEATURE_COSTS, type PaidFeatureKey } from '$lib/features/billing/consts';
import { consumeCredits } from '$lib/features/billing/server/consume-credits.remote';
import { serverIsUserAuthenticated } from '$lib/features/billing/server/utils/is-user-authenticated';
import { languageKeySchema, type LanguageKey } from '$lib/features/user-settings/consts';
import z from 'zod';
import {
	buildImportCacheKey,
	getCachedImport,
	getLlmOutput,
	getScrapeStats
} from '../modules/recipe-cache/import-cache';
import {
	importRecipeFromTextCore,
	importRecipeFromUrlCore,
	type ImportUrlResult
} from './import-recipe';

export const importRecipeFromUrl = query.live(
	z.object({
		spaceId: z.string(),
		url: z.url(),
		fallbackLang: languageKeySchema
	}),
	async function* ({ spaceId, url, fallbackLang }) {
		console.log('Importing recipe from URL', spaceId, url, fallbackLang);

		// Check authentication
		const event = getRequestEvent();
		const { userId, isValid } = await serverIsUserAuthenticated(event.locals.supabase);
		if (!isValid) throw new Error('User must be confirmed with a valid email.');

		// Check credit balance
		const authorized = await canUserAfford(
			event.locals.supabase,
			userId,
			FEATURE_COSTS.import_recipe_from_website.seeds
		);
		if (!authorized) throw new Error('User cannot afford the feature.');

		// Run the credit-free import core, forwarding its progress steps, then
		// charge once for the successful import.
		let result: ImportUrlResult | undefined;
		for await (const value of importRecipeFromUrlCore({
			supabase: event.locals.supabase,
			admin: event.locals.supabaseAdmin,
			userId,
			url,
			fallbackLang: fallbackLang as LanguageKey
		})) {
			if (typeof value === 'number') {
				yield value;
			} else {
				result = value;
			}
		}

		if (!result) throw new Error('Import did not complete.');

		// Recompute cache metadata for the credit log after the import.
		const cacheKey = await buildImportCacheKey(url);
		const cache = await getCachedImport(event.locals.supabaseAdmin, cacheKey);
		const cacheHit = !!cache && !!getLlmOutput(cache);
		const scrapeStats = getScrapeStats(cache);

		const usage = await consumeCredits({
			amount: FEATURE_COSTS.import_recipe_from_website.seeds,
			feature: 'import_recipe_from_website' as PaidFeatureKey,
			metadata: JSON.stringify({
				recipe_url: url,
				cache_hit: cacheHit,
				cache_key: cacheKey,
				strategy: scrapeStats?.strategy ?? null,
				format: scrapeStats?.format ?? null,
				content_length: scrapeStats?.content_length ?? null,
				attempts: scrapeStats?.attempts.length ?? 0
			})
		});

		yield { ...result, usage };
	}
);

export const importRecipeFromText = query.live(
	z.object({
		spaceId: z.string(),
		text: z.string().min(10),
		fallbackLang: languageKeySchema
	}),
	async function* ({ spaceId, text, fallbackLang }) {
		console.log('Importing recipe from text', spaceId, text);
		const event = getRequestEvent();

		// Check authentication
		const { userId, isValid } = await serverIsUserAuthenticated(event.locals.supabase);
		if (!isValid) throw new Error('User must be confirmed with a valid email.');

		// Check credit balance
		const authorized = await canUserAfford(
			event.locals.supabase,
			userId,
			FEATURE_COSTS.import_recipe_from_text.seeds
		);
		if (!authorized) throw new Error('User cannot afford the feature.');

		// Run the credit-free import core, forwarding its progress steps, then
		// charge once for the successful import.
		let result: ImportUrlResult | undefined;
		for await (const value of importRecipeFromTextCore({
			supabase: event.locals.supabase,
			admin: event.locals.supabaseAdmin,
			userId,
			text,
			fallbackLang: fallbackLang as LanguageKey
		})) {
			if (typeof value === 'number') {
				yield value;
			} else {
				result = value;
			}
		}

		if (!result) throw new Error('Import did not complete.');

		const usage = await consumeCredits({
			amount: FEATURE_COSTS.import_recipe_from_text.seeds,
			feature: 'import_recipe_from_text' as PaidFeatureKey,
			metadata: JSON.stringify({
				length: text.length
			})
		});

		yield { ...result, usage };
	}
);
