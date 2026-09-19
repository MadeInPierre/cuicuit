// Phase 1d: thin remote shim — no business logic here.
// The LLM enrichment pipeline (failover, generateText, output repair) lives in
// `$lib/core/operations/recipes/enrich-helpers.ts` as plain helpers, called
// server-side by the `recipes.import-from-url` / `recipes.import-from-text`
// ops. This module only exposes the same UI-callable `query()` surface (same
// export names/signatures) delegating to core, so browser callers — and the
// type-only imports referencing this path (e.g. `enrich-recipe.ts`) — keep
// working unchanged.
import { query } from '$app/server';
import {
	enrichRawRecipe as enrichRawRecipeCore,
	enrichRawRecipeInput,
	enrichTextRecipe as enrichTextRecipeCore,
	enrichTextRecipeInput
} from '$lib/core/operations/recipes/enrich-helpers.js';

export type {
	EnrichedRecipeOutput,
	EnrichedRecipeResult
} from '$lib/core/operations/recipes/enrich-helpers.js';

/**
 * Parses raw scraped content (JSON-LD, recipe JSON, or cleaned Markdown) into a
 * structured, enriched recipe using the LLM. The scraping pipeline passes the
 * raw content through as-is; this is where all parsing into the app schema
 * happens.
 */
export const enrichRawRecipe = query(enrichRawRecipeInput, async (input) =>
	enrichRawRecipeCore(input)
);

/**
 * Takes a free-form recipe text as input and enriches it into a structure DB object.
 * Infers missing details, filters, optional ingredients, etc.
 * Uses a remote LLM.
 *
 * @param text - ny free-form text that should include title, ingredients and steps.
 * @returns A promise that resolves to the enriched recipe.
 */
export const enrichTextRecipe = query(enrichTextRecipeInput, async (input) =>
	enrichTextRecipeCore(input)
);
