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
 * Lists the supported languages. The canonical public identifier is `lang`
 * (BCP47, e.g. `en-US`); integer `id` is DB-internal and informational only.
 * Every language-flavored op input takes `lang: LanguageCode`.
 */
export const languagesListOp = defineOp({
	name: 'languages.list',
	domain: 'languages',
	kind: 'read',
	sync: 'synced',
	docs: {
		title: 'List languages',
		description: 'Lists the supported languages (`lang` codes like `en-US`).',
		tool: 'languages_list',
		hints: ['Every language input is `lang` (BCP47, e.g. `en-US`).']
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
