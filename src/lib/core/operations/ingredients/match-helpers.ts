/**
 * Preprocessing helpers for `ingredients.match` — moved verbatim from
 * `src/lib/features/ingredients/server/match-ingredients.remote.ts`.
 *
 * Co-located helper module, NOT an op (plan/02-core-migration.md §3):
 * one operation = one file, helpers live in `./<op>-helpers.ts`.
 *
 * Language handling: `preprocessIngredient` takes the match language
 * (`xx-YY`, same code as `ingredients.match` input) so articles and
 * preparation verbs from the recipe's language are stripped. To support a
 * new language, add one entry to `ARTICLES_BY_LANG` / `PREP_WORDS_BY_LANG`
 * keyed by its 2-letter prefix — unknown languages fall back to the
 * English/French base lists.
 */

// Base lists (English + French) — also the fallback for unknown languages.
const BASE_NOISE =
	'\\b\\d+\\/\\d+\\b' + // Fractions
	'|\\b\\d*\\.?\\d+\\s*(g|kg|grammes?|oz|lb|ml|l|cl|cup|tasses?|tbsp|c\\.à\\.s|càs|c\\.à\\.c|cac|tsp|teaspoons?|tablespoons?|cuillères? à soupe|cuillères? à café|cloves?|gousses?|pinch|pincées?|tranches?|morceaux?)\\b' +
	'|\\b\\d+\\b' + // Standalone numbers
	'|\\b(diced|chopped|minced|sliced|julienned|crushed|peeled|seeded|cored|halved|quartered|optional|for garnish|to taste|finely|roughly|hach[ée]s?|émietté|facultatif|pour la garniture|au goût)\\b';

const BASE_ARTICLES = ['de', 'du', 'des', "d'", 'la', 'le', 'les', 'un', 'une', 'of', 'the', 'a'];

/** Extra noise words per 2-letter language prefix: preparation verbs and
 * adjectives plus unit nouns left over after quantity stripping
 * (e.g. "2 dientes de ajo" → number gone, "dientes" still noise). */
const EXTRA_NOISE_BY_LANG: Record<string, string[]> = {
	// German: gewürfelt (diced), gehackt (chopped), gerieben (grated), ...
	de: [
		'gewürfelt',
		'gehackt',
		'geschnitten',
		'gerieben',
		'geschält',
		'frisch',
		'klein',
		'groß',
		'gross',
		'fein',
		'grob',
		'optional',
		'nach geschmack',
		'zehen?',
		'scheiben?',
		'dosen?',
		'päckchen',
		'prise[sn]?',
		'stück(e|en)?',
		'bund',
		'tasse[sn]?',
		'würfel',
		'el',
		'tl'
	],
	// Spanish
	es: [
		'picad[oa]s?',
		'cortad[oa]s?',
		'rallad[oa]s?',
		'pelad[oa]s?',
		'fresc[oa]s?',
		'pequeñ[oa]s?',
		'opcional',
		'al gusto',
		'finamente',
		'dientes?',
		'pizcas?',
		'rebanadas?',
		'latas?',
		'cucharad(as?|ita[s]?)'
	],
	// Portuguese (pt-BR + pt-PT share the prefix)
	pt: [
		'picad[oa]s?',
		'cortad[oa]s?',
		'ralad[oa]s?',
		'descascad[oa]s?',
		'fresc[oa]s?',
		'pequen[oa]s?',
		'opcional',
		'a gosto',
		'dentes?',
		'pitadas?',
		'fatias?',
		'latas?',
		'colheres?'
	],
	// Italian
	it: [
		'tagliat[oaie]+',
		'tritat[oaie]+',
		'grattugiat[oaie]+',
		'sbucciat[oaie]+',
		'fresc[oaie]+',
		'piccol[oaie]+',
		'facoltativo',
		'q\\.b\\.',
		'finemente',
		'spicchi?',
		'fette?',
		'pizzic[hoi]',
		'cucchiai[no]*'
	],
	// Dutch
	nl: [
		'gesneden',
		'gehakt',
		'geraspt',
		'geschild?',
		'vers',
		'klein',
		'fijn',
		'grof',
		'optioneel',
		'naar smaak',
		'teentjes?',
		'snufjes?',
		'plakjes?',
		'blikjes?',
		'eetlepels?',
		'theelepels?'
	]
};

/** Extra leading articles per 2-letter language prefix. */
const ARTICLES_BY_LANG: Record<string, string[]> = {
	de: ['der', 'die', 'das', 'den', 'dem', 'einem', 'einen', 'einer', 'eines', 'ein', 'eine'],
	es: ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'del', 'al'],
	pt: ['o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'do', 'da', 'dos', 'das', 'no', 'na'],
	it: [
		'il',
		'lo',
		'la',
		'i',
		'gli',
		'le',
		"l'",
		"un'",
		'un',
		'uno',
		'una',
		'di',
		'del',
		'dello',
		'della',
		"dell'",
		'dei',
		'degli',
		'delle'
	],
	nl: ['de', 'het', 'een']
};

function langPrefix(lang: string | undefined): string {
	return lang?.split('-')[0]?.toLowerCase() ?? '';
}

const noiseRegexCache = new Map<string, RegExp>();
function noiseRegexFor(lang: string | undefined): RegExp {
	const prefix = langPrefix(lang);
	let regex = noiseRegexCache.get(prefix);
	if (!regex) {
		const extra = EXTRA_NOISE_BY_LANG[prefix];
		const pattern = extra?.length
			? `(${BASE_NOISE}|\\b(${extra.join('|')})\\b)`
			: `(${BASE_NOISE})`;
		regex = new RegExp(pattern, 'gi');
		noiseRegexCache.set(prefix, regex);
	}
	return regex;
}

const articlesRegexCache = new Map<string, RegExp>();
function articlesRegexFor(lang: string | undefined): RegExp {
	const prefix = langPrefix(lang);
	let regex = articlesRegexCache.get(prefix);
	if (!regex) {
		const words = [...BASE_ARTICLES, ...(ARTICLES_BY_LANG[prefix] ?? [])]
			// Longest first so e.g. `einer` wins over `ein`.
			.sort((a, b) => b.length - a.length)
			.join('|');
		regex = new RegExp(`^(${words} )`, 'i');
		articlesRegexCache.set(prefix, regex);
	}
	return regex;
}

export function preprocessIngredient(text: string, lang?: string): string {
	if (!text) return '';

	// Convert to lowercase and take primary ingredient before comma/parentheses
	let cleaned = text.toLowerCase().split(',')[0].split('(')[0];

	// Strip mathematical/action noise
	cleaned = cleaned.replace(noiseRegexFor(lang), ' ').trim();

	// Safely remove leading articles without destroying internal words
	// (trimmed first: the regex is start-anchored)
	cleaned = cleaned.replace(articlesRegexFor(lang), '');

	// We will let PostgreSQL handle plurals via its language dictionaries. No naive 's' removal here.

	// Cleanup spacing and punctuation
	return cleaned.replace(/[,\s.-]+/g, ' ').trim();
}
