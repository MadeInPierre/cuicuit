import { query } from '$app/server';

import { requireCtx } from '$lib/core/operations/context.js';
import {
	createDraftRecipeInput,
	type CreateDraftRecipeInput
} from '$lib/core/operations/recipes/create-draft.js';
import { runOp } from '$lib/core/operations/registry.js';

// M2: thinned to a `recipes.create-draft` op call (logic lives in core).
export const createDraftRecipe = query(createDraftRecipeInput, async (input) =>
	runOp<CreateDraftRecipeInput, string>('recipes.create-draft', await requireCtx('app'), input)
);
