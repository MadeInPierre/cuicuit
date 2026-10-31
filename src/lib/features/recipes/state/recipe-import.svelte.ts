import { goto } from '$app/navigation';
import { page } from '$app/state';
import type {
	ImportIngredientPreview,
	ImportMetadata,
	ImportPartialPatch,
	ImportStepPreview
} from '$lib/core/operations/recipes/import-events.js';
import { getUserState } from '$lib/features/auth/state/user-state.svelte';
import {
	finalizeRecipeImport,
	runTextImport,
	runUrlImport,
	type ImportHandlers,
	type TextImportInput,
	type UrlImportInput
} from '../actions/run-recipe-import';
import { toastImportError } from '../components/import-error-toast';

type Phase = 'idle' | 'scraping' | 'importing' | 'done';

/** Progressive preview of the recipe while the LLM streams, section by section. */
export type ImportPreview = {
	lang: string | null;
	metadata: ImportMetadata | null;
	/** Raw LLM ingredients, shown until catalog matching completes. */
	ingredients: ImportIngredientPreview[] | null;
	/** Catalog-matched ingredients (with ids -> images). */
	matched: ImportIngredientPreview[] | null;
	steps: ImportStepPreview[] | null;
};

/**
 * Module-level import controller (URL and text flows).
 *
 * The stream outlives the dialog/form: `startUrl`/`startText` resolve as soon
 * as the draft event arrives (so the caller can close the dialog), while the
 * import continues in the background and the recipe page renders from this
 * state, progressively, as partial sections stream in.
 */
class RecipeImportState {
	phase = $state<Phase>('idle');
	recipeId = $state<string | null>(null);
	title = $state<string | null>(null);
	currentStep = $state(-1);
	/** Uploaded source image id, shown blurred behind the stepper until done. */
	imageId = $state<string | null>(null);
	preview = $state<ImportPreview>({
		lang: null,
		metadata: null,
		ingredients: null,
		matched: null,
		steps: null
	});

	get isImporting(): boolean {
		return this.phase === 'scraping' || this.phase === 'importing';
	}

	isImportingRecipe(id: string): boolean {
		return this.isImporting && this.recipeId === id;
	}

	/** Resolves once the recipe id exists (draft event); rejects if scraping fails. */
	async startUrl(input: UrlImportInput): Promise<void> {
		await this.#start((handlers) => runUrlImport(input, handlers), 'url');
	}

	/** Same flow as URL imports, minus the scrape/image steps. */
	async startText(input: TextImportInput): Promise<void> {
		await this.#start((handlers) => runTextImport(input, handlers), 'text');
	}

	async #start(
		run: (handlers: ImportHandlers) => Promise<{ id: string; isComplete: boolean }>,
		sourceType: 'url' | 'text'
	): Promise<void> {
		if (this.isImporting) throw new Error('A recipe import is already ongoing.');

		this.#reset();
		this.phase = 'scraping';

		let resolveDraft!: () => void;
		let rejectDraft!: (error: unknown) => void;
		const draftReady = new Promise<void>((resolve, reject) => {
			resolveDraft = resolve;
			rejectDraft = reject;
		});

		run({
			onStep: (step) => {
				this.currentStep = step;
			},
			onDraft: (draft) => {
				this.recipeId = draft.recipeId;
				this.title = draft.title;
				this.phase = 'importing';
				this.currentStep = Math.max(this.currentStep, 1);
				resolveDraft();
				void goto(`/recipes/${draft.recipeId}`);
			},
			onImage: (imageId) => {
				this.imageId = imageId;
			},
			onPartial: (patch) => this.#applyPartial(patch)
		})
			.then((result) => {
				finalizeRecipeImport(getUserState(), result, sourceType);
				this.phase = 'done';

				if (!result.isComplete) {
					void goto(`/recipes/${result.id}/edit?banner=import-incomplete`);
				}
			})
			.catch((error) => {
				// Before the draft event the form is still open: let it show the error.
				if (this.phase === 'scraping') {
					this.#reset();
					rejectDraft(error);
					return;
				}

				toastImportError(error);
				const onPreview =
					this.recipeId !== null && page.url.pathname === `/recipes/${this.recipeId}`;
				this.#reset();
				if (onPreview) void goto('/recipes');
			});

		await draftReady;
	}

	#applyPartial(patch: ImportPartialPatch): void {
		if (patch.section === 'metadata') {
			this.preview.lang = patch.lang;
			this.preview.metadata = patch.metadata;
			this.title = patch.metadata.title;
		} else if (patch.section === 'ingredients') {
			this.preview.ingredients = patch.ingredients;
		} else if (patch.section === 'matched') {
			this.preview.matched = patch.ingredients;
		} else {
			this.preview.steps = patch.steps;
		}
	}

	#reset(): void {
		this.phase = 'idle';
		this.recipeId = null;
		this.title = null;
		this.currentStep = -1;
		this.imageId = null;
		this.preview = { lang: null, metadata: null, ingredients: null, matched: null, steps: null };
	}
}

export const recipeImportState = new RecipeImportState();
