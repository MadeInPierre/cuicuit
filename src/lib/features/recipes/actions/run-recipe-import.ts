import {
	isImportProgress,
	type ImportDraft,
	type ImportPartialPatch
} from '$lib/core/operations/recipes/import-events.js';
import type { ImportRecipeFromTextOutput } from '$lib/core/operations/recipes/import-from-text.js';
import type { ImportRecipeFromUrlOutput } from '$lib/core/operations/recipes/import-from-url.js';
import type { UserState } from '$lib/features/auth/state/user-state.svelte';
import { supabase } from '$lib/shared/db/supabase-client.svelte';
import type { LanguageCode } from '$lib/shared/language.js';
import { readSseFrames } from '$lib/shared/utils/sse';
import posthog from 'posthog-js';

/**
 * Shared frontend consumption of the core recipe-import ops.
 *
 * Both imports stream over a plain SSE fetch (not `query.live`) because the
 * import is non-idempotent and the draft event must never be coalesced or
 * replayed, the caller navigates to the recipe page on it.
 */

export const IMPORT_STEPS = [
	'Reading your recipe',
	'Guessing missing details',
	'Recognizing ingredients',
	'Writing the steps'
];

export type RecipeImportResult = ImportRecipeFromUrlOutput | ImportRecipeFromTextOutput;

export type UrlImportInput = { spaceId: string; url: string; lang: LanguageCode };
export type TextImportInput = { spaceId: string; text: string; lang: LanguageCode };

export type ImportHandlers = {
	onStep?: (step: number) => void;
	onDraft?: (draft: ImportDraft) => void;
	onImage?: (imageId: string) => void;
	onPartial?: (patch: ImportPartialPatch) => void;
};

class ImportStreamError extends Error {
	constructor(
		message: string,
		readonly code?: string
	) {
		super(message);
		this.name = 'ImportStreamError';
	}
}

/** Runs one import op over SSE, forwarding progress events to the caller. */
async function streamImport(
	endpoint: string,
	input: UrlImportInput | TextImportInput,
	handlers: ImportHandlers
): Promise<RecipeImportResult> {
	const token = await getAccessToken();
	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify(input)
	});

	if (!response.ok) throw await readApiError(response);
	if (!response.body) throw new ImportStreamError('Import stream unavailable.');

	let result: RecipeImportResult | undefined;
	for await (const frame of readSseFrames(response.body)) {
		if (frame.event === 'error') throw readStreamError(frame.data);

		let value: unknown;
		try {
			value = JSON.parse(frame.data);
		} catch {
			throw new ImportStreamError('Invalid import response.');
		}

		if (isImportProgress(value)) {
			if (value.kind === 'step') handlers.onStep?.(value.step);
			else if (value.kind === 'draft') handlers.onDraft?.(value);
			else if (value.kind === 'image') handlers.onImage?.(value.imageId);
			else handlers.onPartial?.(value.patch);
		} else {
			result = value as RecipeImportResult;
		}
	}

	if (!result) throw new ImportStreamError('Import did not complete.');
	return result;
}

/** Runs the URL import op over SSE, forwarding progress events to the caller. */
export function runUrlImport(
	input: UrlImportInput,
	handlers: ImportHandlers = {}
): Promise<ImportRecipeFromUrlOutput> {
	return streamImport(
		'/api/v1/recipes/import-url',
		input,
		handlers
	) as Promise<ImportRecipeFromUrlOutput>;
}

/** Runs the text import op over SSE, forwarding progress events to the caller. */
export function runTextImport(
	input: TextImportInput,
	handlers: ImportHandlers = {}
): Promise<ImportRecipeFromTextOutput> {
	return streamImport(
		'/api/v1/recipes/import-text',
		input,
		handlers
	) as Promise<ImportRecipeFromTextOutput>;
}

/**
 * Success side effects shared by all import entries: refresh credits and track.
 * Navigation stays with the caller because imports already navigated early
 * (at the draft event).
 */
export function finalizeRecipeImport(
	userState: UserState,
	result: { isComplete: boolean },
	sourceType: 'url' | 'text'
): void {
	userState.refresh();
	posthog.capture('recipe_imported', {
		source_type: sourceType,
		is_complete: result.isComplete
	});
}

async function getAccessToken(): Promise<string> {
	const client = supabase.client;
	if (!client) throw new ImportStreamError('You must be signed in to import a recipe.');

	const { data, error } = await client.auth.getSession();
	const token = data.session?.access_token;
	if (error || !token) {
		throw new ImportStreamError('You must be signed in to import a recipe.');
	}
	return token;
}

async function readApiError(response: Response): Promise<ImportStreamError> {
	const payload = (await response.json().catch(() => null)) as {
		error?: { code?: string; message?: string };
	} | null;
	return new ImportStreamError(
		payload?.error?.message ?? 'Failed to import recipe.',
		payload?.error?.code
	);
}

function readStreamError(data: string): ImportStreamError {
	try {
		const payload = JSON.parse(data) as { code?: string; message?: string };
		return new ImportStreamError(payload.message ?? 'Failed to import recipe.', payload.code);
	} catch {
		return new ImportStreamError('Failed to import recipe.');
	}
}
