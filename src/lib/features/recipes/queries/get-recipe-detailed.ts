import { getClientCtx, runOp } from '$lib/core/operations/client.js';
import type { GetRecipeInput, GetRecipeOutput } from '$lib/core/operations/recipes/get.js';
import type {
	ListRecipesFilter,
	ListRecipesInput,
	ListRecipesOutput
} from '$lib/core/operations/recipes/list.js';

/**
 * M2: thin client adapters over the `recipes.list` / `recipes.get` core ops.
 *
 * `getRecipesDetailed` used to return a PostgREST builder that callers chained
 * (`.limit()`, `.overlaps()`, `.in()`, `.or()`); it now executes via core —
 * pass those filters through `opts` instead (see `ListRecipesInput`).
 */
export async function getRecipesDetailed(
	languageId: number,
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
				languageId,
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
	languageId: number
): Promise<{ data: GetRecipeOutput | null; error: unknown }> {
	try {
		const data = await runOp<GetRecipeInput, GetRecipeOutput>('recipes.get', await getClientCtx(), {
			recipeId,
			languageId
		});
		return { data, error: null };
	} catch (error) {
		console.error('Error fetching recipes:', error);
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
