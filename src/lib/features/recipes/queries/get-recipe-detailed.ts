import { getClientCtx, OpError, runOp } from '$lib/core/operations/client.js';
import type { GetRecipeInput, GetRecipeOutput } from '$lib/core/operations/recipes/get.js';
import type {
	ListRecipesFilter,
	ListRecipesInput,
	ListRecipesOutput
} from '$lib/core/operations/recipes/list.js';
import type { LanguageCode } from '$lib/shared/language.js';
import posthog from 'posthog-js';

/**
 * M2: thin client adapters over the `recipes.list` / `recipes.get` core ops.
 *
 * `getRecipesDetailed` used to return a PostgREST builder that callers chained
 * (`.limit()`, `.overlaps()`, `.in()`, `.or()`); it now executes via core —
 * pass those filters through `opts` instead (see `ListRecipesInput`).
 */
export async function getRecipesDetailed(
	lang: LanguageCode,
	searchText?: string,
	opts?: {
		limit?: number;
		overlaps?: ListRecipesFilter[];
		in?: ListRecipesFilter[];
		or?: string | null;
	}
): Promise<{ data: ListRecipesOutput | null; error: unknown }> {
	try {
		const data = await runOp<ListRecipesInput, ListRecipesOutput>(
			'recipes.list',
			await getClientCtx(),
			{
				lang,
				searchText: searchText ?? '',
				limit: opts?.limit ?? 100,
				overlaps: opts?.overlaps ?? [],
				in: opts?.in ?? [],
				or: opts?.or ?? null
			}
		);
		return { data, error: null };
	} catch (error) {
		console.error('Error fetching recipes:', error);
		return { data: null, error };
	}
}

/**
 * Fetches detailed information about a recipe by its ID.
 * This function retrieves the recipe's language, ingredients,
 * courses, cuisines, times of day, tags, and tools.
 *
 * @param recipeId - The ID of the recipe to fetch.
 * @returns A promise that resolves to the detailed recipe data.
 * @throws Will throw an error if the recipe ID is not provided or if the query fails.
 */
export async function getRecipeDetailed(
	recipeId: string,
	lang: LanguageCode
): Promise<{ data: GetRecipeOutput | null; error: unknown }> {
	try {
		const data = await runOp<GetRecipeInput, GetRecipeOutput>('recipes.get', await getClientCtx(), {
			recipeId,
			lang
		});
		return { data, error: null };
	} catch (error) {
		// A NOT_FOUND is an ordinary 404 (a deleted or inaccessible recipe) that the
		// caller handles with its not-found state. posthog captures console.error as
		// an exception, so warn instead of opening an issue for a normal 404. Genuine
		// fetch failures still surface as a readable exception.
		if (error instanceof OpError && error.code === 'NOT_FOUND') {
			console.warn('Recipe not found:', recipeId);
		} else if (posthog.__loaded) {
			posthog.captureException(new Error('Error fetching recipe'), {
				cause: error instanceof Error ? error.message : error
			});
		}
		return { data: null, error };
	}
}

export type RecipeDetailed = NonNullable<
	Awaited<ReturnType<typeof getRecipesDetailed>>['data']
>[number];
export type Recipe = Omit<RecipeDetailed, 'ingredients'>;

export type RecipeIngredientDetailed = NonNullable<
	Awaited<ReturnType<typeof getRecipeDetailed>>['data']
>['ingredients'][number];

// Basic ingredient without substitutes, used in simpler contexts.
// Note: the `ingredient` embed is nullable on recipe_ingredients rows
// (custom ingredients have no catalog match), so NonNullable it here —
// callers handle the null case via `custom_name`.
export type RecipeIngredientWithTranslations = Omit<
	NonNullable<
		NonNullable<
			Awaited<ReturnType<typeof getRecipeDetailed>>['data']
		>['ingredients'][number]['ingredient']
	>,
	'substitutes'
> & {
	translations: NonNullable<
		NonNullable<
			Awaited<ReturnType<typeof getRecipeDetailed>>['data']
		>['ingredients'][number]['ingredient']
	>['translations'];
};

export type RecipeDetailedWithAuthor = NonNullable<
	Awaited<ReturnType<typeof getRecipeDetailed>>['data']
>;
