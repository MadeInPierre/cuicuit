/**
 * Preprocessing helpers for `ingredients.match`.
 *
 * Turns a raw recipe/search string into the short, accent-free query sent to the
 * `match_ingredient` RPC: lower-case, quantity/preparation words removed, then
 * leading articles removed. Language-specific rules are grouped in
 * `LANGUAGE_RULES`. Add a 2-letter prefix here to support a new language.
 */

/** Noise shared by every language: quantities, units and prep verbs. */
const BASE_NOISE_PATTERNS = [
	String.raw`\b\d+\/\d+\b`, // fractions ("1/2")
	String.raw`\b\d*\.?\d+\s*(g|kg|grammes?|oz|lb|ml|l|cl|cup|tasses?|tbsp|c\.à\.s|càs|c\.à\.c|cac|tsp|teaspoons?|tablespoons?|cuillères? à soupe|cuillères? à café|cloves?|gousses?|pinch|pincées?|tranches?|morceaux?)\b`,
	String.raw`\b\d+\b`, // standalone numbers
	String.raw`\b(diced|chopped|minced|sliced|julienned|crushed|peeled|seeded|cored|halved|quartered|optional|for garnish|to taste|finely|roughly|hach[ée]s?|émietté|facultatif|pour la garniture|au goût)\b`
];

/** Leading articles shared by every language (English + French fallback). */
const BASE_ARTICLES = ['de', 'du', 'des', "d'", 'la', 'le', 'les', 'un', 'une', 'of', 'the', 'a'];

type LanguageRules = {
	/** Extra preparation verbs, adjectives and unit nouns. */
	noise?: string[];
	/** Extra leading articles. */
	articles?: string[];
};

/**
 * Extra words per 2-letter language prefix. Examples: "2 dientes de ajo"
 * leaves "dientes" after the number, "2 tranches de pain" leaves "tranches".
 */
const LANGUAGE_RULES: Record<string, LanguageRules> = {
	de: {
		articles: [
			'der',
			'die',
			'das',
			'den',
			'dem',
			'einem',
			'einen',
			'einer',
			'eines',
			'ein',
			'eine'
		],
		noise: [
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
		]
	},
	es: {
		articles: ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'del', 'al'],
		noise: [
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
		]
	},
	// pt-BR and pt-PT share the same prefix and rules.
	pt: {
		articles: [
			'o',
			'a',
			'os',
			'as',
			'um',
			'uma',
			'uns',
			'umas',
			'do',
			'da',
			'dos',
			'das',
			'no',
			'na'
		],
		noise: [
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
		]
	},
	it: {
		articles: [
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
		noise: [
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
		]
	},
	nl: {
		articles: ['de', 'het', 'een'],
		noise: [
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
	},
	fr: {
		articles: ["l'", 'de la']
	}
};

function langPrefix(lang: string | undefined): string {
	return lang?.split('-')[0]?.toLowerCase() ?? '';
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function languageRulesFor(lang: string | undefined): LanguageRules {
	return LANGUAGE_RULES[langPrefix(lang)] ?? {};
}

function noiseRegexFor(lang: string | undefined): RegExp {
	const extra = languageRulesFor(lang).noise ?? [];
	const patterns = [
		...BASE_NOISE_PATTERNS,
		...extra.map((pattern) => String.raw`\b(?:${pattern})\b`)
	];
	return new RegExp(patterns.join('|'), 'gi');
}

function articlesRegexFor(lang: string | undefined): RegExp {
	const words = [...new Set([...BASE_ARTICLES, ...(languageRulesFor(lang).articles ?? [])])]
		// Longest first so "einer" wins over "ein" and "de la" over "de".
		.sort((a, b) => b.length - a.length)
		.map(escapeRegExp);

	// Plain articles need a trailing space ("la " must not eat "lamb"); elisions
	// such as "d'" and "l'" are glued to the next word instead.
	const spaced = words.filter((word) => !word.endsWith("'"));
	const elided = words.filter((word) => word.endsWith("'"));
	const alternatives = [
		spaced.length ? `(?:${spaced.join('|')})\\s+` : '',
		elided.length ? `(?:${elided.join('|')})` : ''
	].filter(Boolean);

	return new RegExp(`^(?:${alternatives.join('|')})`, 'i');
}

export function preprocessIngredient(text: string, lang?: string): string {
	if (!text) return '';

	// Ignore everything after a comma or parenthesis: it is a description.
	let cleaned = text.toLowerCase().split(',')[0].split('(')[0];

	// Drop quantities, units and preparation words ("2 tbsp", "diced", ...).
	cleaned = cleaned.replace(noiseRegexFor(lang), ' ').trim();

	// Drop leading articles ("la tomate", "the beef", "d'agneau").
	cleaned = cleaned.replace(articlesRegexFor(lang), '');

	// Clean up left-over punctuation and spacing. Plurals are left to Postgres.
	return cleaned.replace(/[,\s.-]+/g, ' ').trim();
}
