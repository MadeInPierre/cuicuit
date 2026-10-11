import { goto } from '$app/navigation';
import type { UserState } from '$lib/features/auth/state/user-state.svelte';
import type { ImportRecipeFromTextOutput } from '$lib/core/operations/recipes/import-from-text.js';
import type { ImportRecipeFromUrlOutput } from '$lib/core/operations/recipes/import-from-url.js';
import type { LanguageCode } from '$lib/shared/language.js';
import posthog from 'posthog-js';
import { toast } from 'svelte-sonner';
import { importRecipeFromText, importRecipeFromUrl } from './import-from-url.remote.js';

/**
 * Shared frontend consumption of the core recipe-import ops.
 *
 * The import logic itself lives in core (`recipes.import-from-url` /
 * `recipes.import-from-text` ops, charged 1 seed after success); this module
 * only holds what every UI entry point (paste dialog forms, share-target
 * receiver page) would otherwise duplicate: step labels, the streaming loop,
 * and the success UX (refresh → analytics → toast → redirect).
 */

export const URL_IMPORT_STEPS = [
	'Finding the recipe',
	'Guessing filters and missing details',
	'Recognizing ingredients & units',
	'Uploading the recipe image'
];

export const TEXT_IMPORT_STEPS = [
	'Warming up',
	'Organizing your recipe',
	'Saving ingredients & units'
];

export type RecipeImportResult = ImportRecipeFromUrlOutput | ImportRecipeFromTextOutput;

async function collectStream<T>(
	stream: AsyncIterable<number | T>,
	onStep?: (step: number) => void
): Promise<T> {
	let result: T | undefined;
	for await (const value of stream) {
		if (typeof value === 'number') onStep?.(value);
		else result = value;
	}
	if (!result) throw new Error('Import did not complete.');
	return result;
}

/** Runs the URL import op, forwarding progress steps to the caller. */
export function runUrlImport(
	input: { spaceId: string; url: string; lang: LanguageCode },
	onStep?: (step: number) => void
): Promise<ImportRecipeFromUrlOutput> {
	return collectStream(importRecipeFromUrl(input), onStep);
}

/** Runs the text import op, forwarding progress steps to the caller. */
export function runTextImport(
	input: { spaceId: string; text: string; lang: LanguageCode },
	onStep?: (step: number) => void
): Promise<ImportRecipeFromTextOutput> {
	return collectStream(importRecipeFromText(input), onStep);
}

/**
 * Success UX shared by all import entries: refresh credits, track, toast,
 * and land on the recipe (or its editor when fields are missing).
 */
export function completeRecipeImport(
	userState: UserState,
	result: RecipeImportResult,
	sourceType: 'url' | 'text'
): void {
	userState.refresh();
	posthog.capture('recipe_imported', {
		source_type: sourceType,
		is_complete: result.isComplete
	});

	if (result.isComplete) {
		toast.success('Recipe imported successfully!');
		goto(`/recipes/${result.id}`);
	} else {
		toast.warning('Some fields are missing, please complete the recipe.');
		goto(`/recipes/${result.id}/edit?banner=import-incomplete`);
	}
}
