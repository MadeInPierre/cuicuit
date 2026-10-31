import { findRecipeNode } from './ldjson';
import type { ScrapeFormat } from './types';

/** Matches the existing imported-recipe title cap (47 chars + ellipsis). */
export function truncateRecipeTitle(title: string): string {
	return title.length >= 47 ? `${title.slice(0, 47)}...` : title;
}

/**
 * Best-effort title from a scrape result, without an LLM call.
 * Only the two structured formats carry a reliable title; markdown does not.
 */
export function extractScrapedTitle(format: ScrapeFormat, content: string): string | null {
	try {
		if (format === 'ldjson') {
			const recipe = findRecipeNode(JSON.parse(content));
			const name = recipe?.['name'];
			return typeof name === 'string' && name.trim() ? name.trim() : null;
		}
		if (format === 'recipe-json') {
			const payload = JSON.parse(content) as { title?: unknown };
			return typeof payload.title === 'string' && payload.title.trim()
				? payload.title.trim()
				: null;
		}
	} catch {
		// Cached or provider content can be malformed; title is optional.
	}
	return null;
}
