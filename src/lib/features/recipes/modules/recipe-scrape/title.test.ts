import { describe, expect, it } from 'vitest';

import { extractScrapedTitle, truncateRecipeTitle } from './title';

describe('extractScrapedTitle', () => {
	it('reads the name from a JSON-LD recipe node', () => {
		const content = JSON.stringify({
			'@context': 'https://schema.org',
			'@graph': [{ '@type': 'Recipe', name: '  Pasta al pomodoro  ' }]
		});
		expect(extractScrapedTitle('ldjson', content)).toBe('Pasta al pomodoro');
	});

	it('reads the title from a recipe-scrapers payload', () => {
		expect(extractScrapedTitle('recipe-json', JSON.stringify({ title: 'Tarte tatin' }))).toBe(
			'Tarte tatin'
		);
	});

	it('returns null for markdown, empty titles, and malformed content', () => {
		expect(extractScrapedTitle('markdown', '# Pasta')).toBeNull();
		expect(
			extractScrapedTitle('ldjson', JSON.stringify({ '@type': 'Recipe', name: ' ' }))
		).toBeNull();
		expect(extractScrapedTitle('ldjson', 'not json')).toBeNull();
		expect(extractScrapedTitle('recipe-json', '{}')).toBeNull();
	});
});

describe('truncateRecipeTitle', () => {
	it('keeps short titles and caps long ones at 47 chars + ellipsis', () => {
		expect(truncateRecipeTitle('Short title')).toBe('Short title');
		expect(truncateRecipeTitle('a'.repeat(46))).toBe('a'.repeat(46));
		expect(truncateRecipeTitle('a'.repeat(47))).toBe(`${'a'.repeat(47)}...`);
	});
});
