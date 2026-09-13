import { z } from 'zod';

import { languageKeySchema, type LanguageKey } from '$lib/features/user-settings/consts';
import { EXAMPLE_RECIPE_URLS } from '$lib/features/recipes/consts/example-recipes';

import { OpError } from '../errors.js';
import { defineOp } from '../registry.js';
import { importRecipeFromUrlCore, type ImportUrlResult } from './import-from-url-helpers.js';

export const addExampleRecipesInput = z.object({
	fallbackLang: languageKeySchema
});

export type AddExampleRecipesInput = z.infer<typeof addExampleRecipesInput>;

/**
 * Imports the curated example recipes into the user's library. Reuses the exact
 * same cache-backed import logic as a normal URL import, but never charges
 * credits — the recipes are already cached, so it only duplicates them.
 * Moved from `features/recipes/actions/add-example-recipes.remote.ts`.
 */
export const addExampleRecipesOp = defineOp({
	name: 'recipes.add-examples',
	domain: 'recipes',
	kind: 'write',
	sync: 'server-only',
	input: addExampleRecipesInput,
	handler: async (ctx, { fallbackLang }) => {
		if (!ctx.admin) {
			throw new OpError('INTERNAL', 'Adding example recipes requires a server context.');
		}

		const results: ImportUrlResult[] = [];

		const urls = EXAMPLE_RECIPE_URLS[fallbackLang as LanguageKey] ?? EXAMPLE_RECIPE_URLS['fr-FR']!;
		for (const url of urls) {
			let result: ImportUrlResult | undefined;
			for await (const value of importRecipeFromUrlCore({
				supabase: ctx.supabase,
				admin: ctx.admin,
				userId: ctx.userId,
				url,
				fallbackLang: fallbackLang as LanguageKey
			})) {
				if (typeof value !== 'number') result = value;
			}
			if (result) results.push(result);
		}

		return results;
	}
});
