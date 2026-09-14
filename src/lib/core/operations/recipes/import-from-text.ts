import { z } from 'zod';

import { languageCodeSchema, type LanguageCode } from '$lib/shared/language.js';

import { canAfford, type CreditUsage } from '../credits.js';
import { OpError } from '../errors.js';
import { defineOp } from '../registry.js';
import { importRecipeFromTextCore, type ImportUrlResult } from './import-from-url-helpers.js';

export const importRecipeFromTextInput = z.object({
	spaceId: z.string(),
	text: z.string().min(10),
	lang: languageCodeSchema
});

export type ImportRecipeFromTextInput = z.infer<typeof importRecipeFromTextInput>;

/** Final streamed value: import result + credit usage (the wire shape forms consume). */
export type ImportRecipeFromTextOutput = ImportUrlResult & { usage: CreditUsage };

/**
 * Imports a recipe from free-form text (draft → enrich → save), charging 1 seed.
 * Moved from `features/recipes/actions/import-from-url.remote.ts:importRecipeFromText`
 * + `features/recipes/actions/import-recipe.ts:importRecipeFromTextCore`.
 *
 * Streams progress numbers, then yields the final `{ id, isComplete, usage }`
 * (`isComplete: false` so the user reviews the imported data).
 */
export const importRecipeFromTextOp = defineOp({
	name: 'recipes.import-from-text',
	domain: 'recipes',
	kind: 'write',
	sync: 'server-only',
	docs: {
		title: 'Import recipe from text',
		description: 'Imports a recipe from free-form text, charging 1 seed.',
		hints: [
			'On INSUFFICIENT_SEEDS nothing is created — check seeds_balance and ask the user to top up in the app billing section (agents cannot pay).'
		]
	},
	credits: { feature: 'import_recipe_from_text', seeds: 1 },
	input: importRecipeFromTextInput,
	handler: async function* (ctx, { text, lang }) {
		if (!(await canAfford(ctx, 1))) {
			throw new OpError('INSUFFICIENT_SEEDS', 'User cannot afford the feature.');
		}
		if (!ctx.admin) {
			throw new OpError('INTERNAL', 'Importing a recipe requires a server context.');
		}

		// Run the credit-free import core, forwarding its progress steps.
		let result: ImportUrlResult | undefined;
		for await (const value of importRecipeFromTextCore({
			supabase: ctx.supabase,
			admin: ctx.admin,
			userId: ctx.userId,
			text,
			lang: lang as LanguageCode
		})) {
			if (typeof value === 'number') {
				yield value;
			} else {
				result = value;
			}
		}

		if (!result) throw new OpError('INTERNAL', 'Import did not complete.');

		// Same `consume_credits` call `credits.ts:withCredits` makes (see
		// `recipes.import-from-url` for why it is replicated, not reused).
		const { data, error } = await ctx.admin.rpc('consume_credits', {
			p_amount_to_consume: 1,
			p_source: 'import_recipe_from_text',
			p_user_id: ctx.userId,
			p_metadata: JSON.stringify({
				length: text.length
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
