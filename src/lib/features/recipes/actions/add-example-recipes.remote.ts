import { command, getRequestEvent } from '$app/server';
import { serverIsUserAuthenticated } from '$lib/features/billing/server/utils/is-user-authenticated';
import { languageKeySchema, type LanguageKey } from '$lib/features/user-settings/consts';
import z from 'zod';
import { EXAMPLE_RECIPE_URLS } from '../consts/example-recipes';
import { importRecipeFromUrlCore, type ImportUrlResult } from './import-recipe';

/**
 * Imports the curated example recipes into the user's space. Reuses the exact
 * same cache-backed import logic as a normal URL import, but never charges
 * credits — the recipes are already cached, so it only duplicates them.
 */
export const addExampleRecipes = command(
	z.object({
		fallbackLang: languageKeySchema
	}),
	async ({ fallbackLang }) => {
		console.log('Adding example recipes');

		const event = getRequestEvent();
		const { userId, isValid } = await serverIsUserAuthenticated(event.locals.supabase);
		if (!isValid) throw new Error('User must be confirmed with a valid email.');

		const results: ImportUrlResult[] = [];

		const urls = EXAMPLE_RECIPE_URLS[fallbackLang as LanguageKey] ?? EXAMPLE_RECIPE_URLS['fr-FR']!;
		for (const url of urls) {
			let result: ImportUrlResult | undefined;
			for await (const value of importRecipeFromUrlCore({
				supabase: event.locals.supabase,
				admin: event.locals.supabaseAdmin,
				userId,
				url,
				fallbackLang: fallbackLang as LanguageKey
			})) {
				if (typeof value !== 'number') result = value;
			}
			if (result) results.push(result);
		}

		return results;
	}
);
