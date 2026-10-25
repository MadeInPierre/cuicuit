import { describe, expect, it } from 'vitest';

import { preprocessIngredient } from './match-helpers.js';

describe('preprocessIngredient', () => {
	it.each([
		['en-US', 'lamb leg', 'lamb leg'],
		['en-US', 'lamb', 'lamb'],
		['en-US', 'lemon', 'lemon'],
		['en-US', 'desire', 'desire'],
		['en-US', 'the beef', 'beef'],
		['en-US', 'a lemon', 'lemon'],
		['en-US', '2 tbsp of olive oil', 'olive oil'],
		['fr-FR', '2 tranches de pain', 'pain'],
		['de-DE', '2 scheiben brot', 'brot'],
		['es-ES', '2 dientes de ajo', 'ajo'],
		['fr-FR', 'la tomate', 'tomate'],
		['fr-FR', "l'agneau", 'agneau'],
		['fr-FR', 'de la farine', 'farine'],
		['de-DE', 'die Kartoffel', 'kartoffel'],
		['de-DE', 'eine Zwiebel', 'zwiebel'],
		['es-ES', 'el ajo', 'ajo'],
		['it-IT', "l'aglio", 'aglio']
	])('strips leading articles in %s without cutting words (%s)', (lang, input, expected) => {
		expect(preprocessIngredient(input, lang)).toBe(expected);
	});
});
