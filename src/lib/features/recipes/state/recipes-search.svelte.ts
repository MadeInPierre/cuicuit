import { goto } from '$app/navigation';
import { page } from '$app/state';

/**
 * All available recipe search filter keys, in URL encoding order.
 * To add a new filter, append its key here and add its definition
 * in `components/recipe-filter-defs.ts` — encode/decode adapt automatically.
 */
export const recipeFilterKeys = [
	'timeOfDay',
	'course',
	'cuisine',
	'effort',
	'cleanup',
	'skill',
	'cost',
	'prepTime',
	'cookTime',
	'restTime',
	'totalTime'
] as const;

export type RecipeFilterKey = (typeof recipeFilterKeys)[number];

export type RecipeSearchFilters = Record<RecipeFilterKey, string[]>;

export type RecipeGroupByKey = 'recommended' | 'cookableState' | 'timeOfDay' | 'course' | 'cuisine';
export type RecipeDiscoverKey = 'familiar' | 'mixed' | 'discover';

export type RecipesPageParameters = {
	groupBy: RecipeGroupByKey;
	discover: RecipeDiscoverKey;
	filters: RecipeSearchFilters;
};

export function emptyRecipeFilters(): RecipeSearchFilters {
	const filters = {} as RecipeSearchFilters;
	for (const key of recipeFilterKeys) {
		filters[key] = [];
	}
	return filters;
}

// Compact encoding: join arrays with ',' and separate keys with '|'
// (positions follow `recipeFilterKeys` order; missing trailing parts decode as [])
export function encodeRecipeFilters(filters: RecipeSearchFilters): string {
	return recipeFilterKeys.map((key) => filters[key].join(',')).join('|');
}

export function decodeRecipeFilters(filters: string | null): RecipeSearchFilters {
	const decoded = emptyRecipeFilters();
	if (!filters) return decoded;
	const parts = filters.split('|');
	recipeFilterKeys.forEach((key, index) => {
		const part = parts[index];
		if (part) decoded[key] = part.split(',').filter(Boolean);
	});
	return decoded;
}

class RecipesSearchState {
	/** Free-text search term, shared between the recipes page and the mobile navbar. */
	searchInput = $state('');

	/** URL-backed parameters (groupBy, discover, filters), derived from the current URL. */
	get parameters(): RecipesPageParameters {
		return {
			groupBy: (page.url.searchParams.get('groupBy') as RecipeGroupByKey) || 'course',
			discover: (page.url.searchParams.get('discover') as RecipeDiscoverKey) || 'familiar',
			filters: decodeRecipeFilters(page.url.searchParams.get('filters'))
		};
	}

	setParameters(newParameters: RecipesPageParameters) {
		const query = new URLSearchParams(page.url.searchParams.toString());

		if (!newParameters.groupBy || newParameters.groupBy === 'course') {
			query.delete('groupBy');
		} else {
			query.set('groupBy', newParameters.groupBy);
		}

		if (!newParameters.discover || newParameters.discover === 'familiar') {
			query.delete('discover');
		} else {
			query.set('discover', newParameters.discover);
		}

		if (Object.values(newParameters.filters).some((arr) => arr.length > 0)) {
			query.set('filters', encodeRecipeFilters(newParameters.filters));
		} else {
			query.delete('filters');
		}

		goto(`?${query.toString()}`);
	}

	reset() {
		this.searchInput = '';
		this.setParameters({ ...this.parameters, filters: emptyRecipeFilters() });
	}

	/**
	 * Use the given text as the recipes search term. Navigates to /recipes
	 * when coming from another page; when already there, the page reacts
	 * to the shared searchInput automatically.
	 */
	searchFromNavbar(text: string) {
		this.searchInput = text.trim();
		if (!page.url.pathname.startsWith('/recipes')) {
			goto('/recipes');
		}
	}
}

export const recipesSearchState = new RecipesSearchState();
