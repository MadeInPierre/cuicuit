import { command, query } from '$app/server';

import { requireCtx, runOp } from '$lib/core/operations';
import {
	addIngredientSubstitutionInput,
	type AddIngredientSubstitutionInput
} from '$lib/core/operations/ingredients/add-substitution.js';
import {
	createIngredientInput,
	type CreateIngredientInput
} from '$lib/core/operations/ingredients/create.js';
import {
	deleteIngredientTranslationInput,
	type DeleteIngredientTranslationInput
} from '$lib/core/operations/ingredients/delete-translation.js';
import {
	getIngredientInput,
	type GetIngredientInput,
	type GetIngredientResult
} from '$lib/core/operations/ingredients/get.js';
import {
	removeIngredientSubstitutionInput,
	type RemoveIngredientSubstitutionInput
} from '$lib/core/operations/ingredients/remove-substitution.js';
import {
	updateIngredientInput,
	type UpdateIngredientInput
} from '$lib/core/operations/ingredients/update.js';
import {
	updateIngredientSubstitutionInput,
	type UpdateIngredientSubstitutionInput
} from '$lib/core/operations/ingredients/update-substitution.js';
import {
	upsertIngredientTranslationInput,
	type UpsertIngredientTranslationInput
} from '$lib/core/operations/ingredients/upsert-translation.js';

/**
 * Thin adapters over the admin-only ingredient ops — no business logic here.
 * The `/admin` layout already gates the page; each op re-checks the admin
 * role server-side via `requireAdmin`, so these remotes are safe to expose.
 */

export const getIngredientAdmin = query(getIngredientInput, async (input: GetIngredientInput) =>
	runOp<GetIngredientInput, GetIngredientResult>(
		'ingredients.get',
		await requireCtx('app'),
		input
	)
);

export const createIngredientAdmin = command(createIngredientInput, async (input: CreateIngredientInput) =>
	runOp('ingredients.create', await requireCtx('app'), input)
);

export const updateIngredientAdmin = command(updateIngredientInput, async (input: UpdateIngredientInput) =>
	runOp('ingredients.update', await requireCtx('app'), input)
);

export const upsertIngredientTranslationAdmin = command(
	upsertIngredientTranslationInput,
	async (input: UpsertIngredientTranslationInput) =>
		runOp('ingredients.upsert-translation', await requireCtx('app'), input)
);

export const deleteIngredientTranslationAdmin = command(
	deleteIngredientTranslationInput,
	async (input: DeleteIngredientTranslationInput) =>
		runOp('ingredients.delete-translation', await requireCtx('app'), input)
);

export const addIngredientSubstitutionAdmin = command(
	addIngredientSubstitutionInput,
	async (input: AddIngredientSubstitutionInput) =>
		runOp('ingredients.add-substitution', await requireCtx('app'), input)
);

export const updateIngredientSubstitutionAdmin = command(
	updateIngredientSubstitutionInput,
	async (input: UpdateIngredientSubstitutionInput) =>
		runOp('ingredients.update-substitution', await requireCtx('app'), input)
);

export const removeIngredientSubstitutionAdmin = command(
	removeIngredientSubstitutionInput,
	async (input: RemoveIngredientSubstitutionInput) =>
		runOp('ingredients.remove-substitution', await requireCtx('app'), input)
);
// NOTE: `ingredients.upload-image` has no remote — it runs browser-direct via
// `runOp` + `getClientCtx` (same as `recipes.upload-image`), because `File`
// cannot travel through a remote `command`. See the op docs.
