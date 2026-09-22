import { z } from 'zod';

import { EXAMPLE_RECIPE_URLS } from '$lib/features/recipes/consts/example-recipes';
import { DEFAULT_LANGUAGE, languageCodeSchema, type LanguageCode } from '$lib/shared/language.js';

import { OpError } from '../errors.js';
import { defineOp } from '../registry.js';
import { importRecipeFromUrlCore, type ImportUrlResult } from './import-from-url-helpers.js';

export const addExampleRecipesInput = z.object({
	lang: languageCodeSchema
});

export type AddExampleRecipesInput = z.infer<typeof addExampleRecipesInput>;

/**
 * Imports the curated example recipes into the user's library. Reuses the
 * cached scrape + LLM output like a normal URL import, but never charges
 * credits. Ingredient matching re-runs against the live catalog.
 * Moved from `features/recipes/actions/add-example-recipes.remote.ts`.
 */
export const addExampleRecipesOp = defineOp({
	name: 'recipes.add-examples',
	domain: 'recipes',
	kind: 'write',
	sync: 'server-only',
	docs: {
		title: 'Add example recipes',
		description:
			'Imports the curated example recipes into the user library without charging credits. The fastest way to get plannable recipes; takes `lang` like `en-US` or `fr-FR`.',
		tool: 'recipes_add_examples'
	},
	input: addExampleRecipesInput,
	handler: async (ctx, { lang }) => {
		if (!ctx.admin) {
			throw new OpError('INTERNAL', 'Adding example recipes requires a server context.');
		}

		const results: ImportUrlResult[] = [];

		const urls =
			EXAMPLE_RECIPE_URLS[lang as LanguageCode] ?? EXAMPLE_RECIPE_URLS[DEFAULT_LANGUAGE]!;
		for (const url of urls) {
			let result: ImportUrlResult | undefined;
			for await (const value of importRecipeFromUrlCore({
				supabase: ctx.supabase,
				admin: ctx.admin,
				userId: ctx.userId,
				url,
				lang: lang as LanguageCode
			})) {
				if (typeof value !== 'number') result = value;
			}
			if (result) results.push(result);
		}

		return results;
	}
});
