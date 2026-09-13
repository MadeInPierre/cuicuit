import { query } from '$app/server';

import { requireCtx, runOp } from '$lib/core/operations';
import {
	matchIngredientsInput,
	type MatchIngredientsInput,
	type MatchIngredientsResult
} from '$lib/core/operations/ingredients/match.js';

/** Thin adapter over `ingredients.match` — no business logic here. */
export const matchIngredientsRPC = query(matchIngredientsInput, async (input) =>
	runOp<MatchIngredientsInput, MatchIngredientsResult>(
		'ingredients.match',
		await requireCtx('app'),
		input
	)
);
