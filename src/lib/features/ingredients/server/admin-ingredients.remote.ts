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
	listCustomIngredientsInput,
	type ListCustomIngredientsInput,
	type ListCustomIngredientsResult
} from '$lib/core/operations/ingredients/list-custom.js';
import {
	relinkCustomIngredientInput,
	type RelinkCustomIngredientInput,
	type RelinkCustomIngredientResult
} from '$lib/core/operations/ingredients/relink-custom.js';
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
import {
	batchApplyInput,
	type BatchApplyInput
} from '$lib/core/operations/ingredients/batch-apply.js';
import {
	batchRunInlineInput,
	type BatchRunInlineInput,
	type BatchRunInlineResult
} from '$lib/core/operations/ingredients/batch-run-inline.js';
import {
	batchStatusInput,
	type BatchStatusInput
} from '$lib/core/operations/ingredients/batch-status.js';
import {
	batchSubmitInput,
	type BatchSubmitInput
} from '$lib/core/operations/ingredients/batch-submit.js';
import {
	deleteImageCandidateInput,
	type DeleteImageCandidateInput
} from '$lib/core/operations/ingredients/delete-image-candidate.js';
import {
	generateIngredientImageInput,
	type GenerateIngredientImageInput
} from '$lib/core/operations/ingredients/generate-image.js';
import {
	listImageCandidatesInput,
	type ListImageCandidatesInput,
	type ImageCandidate
} from '$lib/core/operations/ingredients/list-image-candidates.js';
import {
	promoteImageCandidateInput,
	type PromoteImageCandidateInput
} from '$lib/core/operations/ingredients/promote-image.js';

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

export const listCustomIngredientsAdmin = query(
	listCustomIngredientsInput,
	async (input: ListCustomIngredientsInput) =>
		runOp<ListCustomIngredientsInput, ListCustomIngredientsResult>(
			'ingredients.list-custom',
			await requireCtx('app'),
			input
		)
);

export const relinkCustomIngredientAdmin = command(
	relinkCustomIngredientInput,
	async (input: RelinkCustomIngredientInput) =>
		runOp<RelinkCustomIngredientInput, RelinkCustomIngredientResult>(
			'ingredients.relink-custom',
			await requireCtx('app'),
			input
		)
);

/**
 * M4 batch adapters — thin, no business logic. Review-before-save is
 * enforced by the UI (results are returned for review, never auto-applied).
 */
export const batchRunInlineAdmin = command(
	batchRunInlineInput,
	async (input: BatchRunInlineInput) =>
		runOp<BatchRunInlineInput, BatchRunInlineResult>(
			'ingredients.batch-run-inline',
			await requireCtx('app'),
			input
		)
);

export const batchSubmitAdmin = command(
	batchSubmitInput,
	async (input: BatchSubmitInput) =>
		runOp('ingredients.batch-submit', await requireCtx('app'), input)
);

export const batchStatusAdmin = command(batchStatusInput, async (input: BatchStatusInput) =>
	// `command` (POST body), not `query`: the job spec carries up to 2000
	// ingredient ids, which would overflow a query URL.
	runOp('ingredients.batch-status', await requireCtx('app'), input)
);

export const batchApplyAdmin = command(
	batchApplyInput,
	async (input: BatchApplyInput) => runOp('ingredients.batch-apply', await requireCtx('app'), input)
);

/**
 * M5 image-studio adapters — thin, no business logic. Generation never
 * touches the active image; promotion copies a candidate over it.
 */
export const generateIngredientImageAdmin = command(
	generateIngredientImageInput,
	async (input: GenerateIngredientImageInput) =>
		runOp('ingredients.generate-image', await requireCtx('app'), input)
);

export const listImageCandidatesAdmin = query(
	listImageCandidatesInput,
	async (input: ListImageCandidatesInput) =>
		runOp<ListImageCandidatesInput, { candidates: ImageCandidate[] }>(
			'ingredients.list-image-candidates',
			await requireCtx('app'),
			input
		)
);

export const promoteImageCandidateAdmin = command(
	promoteImageCandidateInput,
	async (input: PromoteImageCandidateInput) =>
		runOp('ingredients.promote-image', await requireCtx('app'), input)
);

export const deleteImageCandidateAdmin = command(
	deleteImageCandidateInput,
	async (input: DeleteImageCandidateInput) =>
		runOp('ingredients.delete-image-candidate', await requireCtx('app'), input)
);
// NOTE: `ingredients.upload-image` has no remote — it runs browser-direct via
// `runOp` + `getClientCtx` (same as `recipes.upload-image`), because `File`
// cannot travel through a remote `command`. See the op docs.
