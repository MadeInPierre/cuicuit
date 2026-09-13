import { query } from '$app/server';

import { requireCtx } from '$lib/core/operations/context.js';
import {
	importRecipeFromTextInput,
	type ImportRecipeFromTextOutput
} from '$lib/core/operations/recipes/import-from-text.js';
import {
	importRecipeFromUrlInput,
	type ImportRecipeFromUrlOutput
} from '$lib/core/operations/recipes/import-from-url.js';
import { runOpStream } from '$lib/core/operations/registry.js';

// M2: thinned to `recipes.import-from-url` / `recipes.import-from-text` op
// calls (credit gating lives in the core ops now). The explicit generator
// types preserve the streaming wire shape the import forms consume.
export const importRecipeFromUrl = query.live(
	importRecipeFromUrlInput,
	async function* (input): AsyncGenerator<number | ImportRecipeFromUrlOutput, void, unknown> {
		yield* runOpStream('recipes.import-from-url', await requireCtx('app'), input) as AsyncGenerator<
			number | ImportRecipeFromUrlOutput,
			void,
			unknown
		>;
	}
);

export const importRecipeFromText = query.live(
	importRecipeFromTextInput,
	async function* (input): AsyncGenerator<number | ImportRecipeFromTextOutput, void, unknown> {
		yield* runOpStream(
			'recipes.import-from-text',
			await requireCtx('app'),
			input
		) as AsyncGenerator<number | ImportRecipeFromTextOutput, void, unknown>;
	}
);
