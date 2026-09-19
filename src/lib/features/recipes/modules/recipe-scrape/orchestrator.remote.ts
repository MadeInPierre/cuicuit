// Phase 1d: thin remote shim — no business logic here.
// The scrape orchestration (strategy ordering, quality gate, outcome logging)
// lives in `$lib/core/operations/recipes/scrape-helpers.ts` as the plain
// `scrapeRecipeUrl` helper, called server-side by the
// `recipes.import-from-url` op. This module only exposes the same
// UI-callable `query()` surface (same export name/signature) delegating to
// core, so browser callers — and the type/test boundary stubs referencing
// this path — keep working unchanged.
import { query } from '$app/server';
import { importRecipeUrlSchema } from '../../models/schemas';
import { scrapeRecipeUrl as scrapeRecipeUrlCore } from '$lib/core/operations/recipes/scrape-helpers.js';

export const scrapeRecipeUrl = query(importRecipeUrlSchema, async ({ url }) =>
	scrapeRecipeUrlCore({ url })
);
