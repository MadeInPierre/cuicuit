import { command } from '$app/server';

import { requireCtx } from '$lib/core/operations/context.js';
import {
	addExampleRecipesInput,
	type AddExampleRecipesInput
} from '$lib/core/operations/recipes/add-examples.js';
import type { ImportUrlResult } from '$lib/core/operations/recipes/import-from-url-helpers.js';
import { runOp } from '$lib/core/operations/registry.js';

// M2: thinned to a `recipes.add-examples` op call (logic lives in core).
export const addExampleRecipes = command(addExampleRecipesInput, async (input) =>
	runOp<AddExampleRecipesInput, ImportUrlResult[]>(
		'recipes.add-examples',
		await requireCtx('app'),
		input
	)
);
