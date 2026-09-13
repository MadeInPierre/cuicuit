import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp } from '../registry.js';

export const languagesListInput = z.object({});

export type LanguagesListInput = z.infer<typeof languagesListInput>;

export type LanguagesListOutput = {
	id: number;
	code: string;
	lang: string;
	name_en: string;
	name_local: string;
}[];

/**
 * Lists the supported languages (ids ↔ codes) backing every language-flavored
 * input (`languageId`, `lang`, `fallbackLang`). Any logged-in user can read
 * the `languages` table, so this is a plain RLS read.
 */
export const languagesListOp = defineOp({
	name: 'languages.list',
	domain: 'languages',
	kind: 'read',
	sync: 'synced',
	docs: {
		title: 'List languages',
		description:
			'Lists the supported languages with their integer `id`. Call once before any tool needing a language.',
		tool: 'languages_list',
		hints: [
			'Language inputs across tools: `languageId` = integer `id`; `lang` = 2-letter `code` (e.g. `en`); `fallbackLang` = full `lang` key (e.g. `en-US`).'
		]
	},
	input: languagesListInput,
	handler: async (ctx): Promise<LanguagesListOutput> => {
		const { data, error } = await ctx.supabase
			.from('languages')
			.select('id, code, lang, name_en, name_local')
			.order('id');
		if (error || !data) {
			throw new OpError('INTERNAL', 'Failed to list languages.', error);
		}
		return data;
	}
});
