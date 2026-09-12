import { goto } from '$app/navigation';
import { page } from '$app/state';

export type RecipeSearchFilters = {
	timeOfDay: string[];
	course: string[];
	cuisine: string[];
};

export type RecipeGroupByKey = 'recommended' | 'cookableState' | 'timeOfDay' | 'course' | 'cuisine';
export type RecipeDiscoverKey = 'familiar' | 'mixed' | 'discover';

export type RecipesPageParameters = {
	groupBy: RecipeGroupByKey;
	discover: RecipeDiscoverKey;
	filters: RecipeSearchFilters;
};

export function emptyRecipeFilters(): RecipeSearchFilters {
	return { timeOfDay: [], course: [], cuisine: [] };
}

// Compact encoding: join arrays with ',' and separate keys with '|'
export function encodeRecipeFilters(filters: RecipeSearchFilters): string {
	const timeOfDay = filters.timeOfDay.join(',');
	const course = filters.course.join(',');
	const cuisine = filters.cuisine.join(',');
	return `${timeOfDay}|${course}|${cuisine}`;
}

export function decodeRecipeFilters(filters: string | null): RecipeSearchFilters {
	if (!filters) return emptyRecipeFilters();
	const [timeOfDayStr = '', courseStr = '', cuisineStr = ''] = filters.split('|');
	return {
		timeOfDay: timeOfDayStr ? timeOfDayStr.split(',').filter(Boolean) : [],
		course: courseStr ? courseStr.split(',').filter(Boolean) : [],
		cuisine: cuisineStr ? cuisineStr.split(',').filter(Boolean) : []
	};
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
