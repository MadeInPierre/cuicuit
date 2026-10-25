import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';

import type { Database } from '$lib/shared/db/supabase.types';

import { preprocessIngredient } from './match-helpers.js';

/**
 * Self-contained ingredient-matching benchmark.
 *
 * Each case runs the real search pipeline (`preprocessIngredient` + the
 * `match_ingredient` RPC) against the local reference catalog. Expectations
 * are catalog slugs, not display names, so the benchmark is language- and
 * label-independent. A case is correct when its top-1 match is any accepted
 * slug (the catalog contains a few intentional duplicates).
 *
 * Easy cases are canonical names; medium cases are common catalog synonyms
 * (often with quantities); hard cases are longer/reordered synonyms plus
 * known problem inputs (articles, preparation words, local units, etc.).
 * The hard/medium expectations come from the catalog itself: a synonym is
 * expected to resolve to the ingredient that lists it.
 *
 * The suite skips cleanly when local Supabase is not running.
 */

const LANGS = ['en-US', 'fr-FR', 'es-ES', 'pt-BR', 'de-DE', 'it-IT', 'nl-NL', 'pt-PT'] as const;
type BenchmarkLang = (typeof LANGS)[number];
type Difficulty = 'easy' | 'medium' | 'hard';

type BenchmarkCase = { input: string; expected: string[] };
type LangCases = Record<Difficulty, BenchmarkCase[]>;

const c = (input: string, ...expected: string[]): BenchmarkCase => ({ input, expected });

const CASES: Record<BenchmarkLang, LangCases> = {
	'en-US': {
		easy: [
			c('flour', 'farine'),
			c('sugar', 'sucre'),
			c('salt', 'sel'),
			c('eggs', 'oeuf'),
			c('milk', 'lait'),
			c('butter', 'beurre'),
			c('olive oil', 'huile-d-olive'),
			c('tomatoes', 'tomate'),
			c('onions', 'oignon'),
			c('clove of garlic', 'ail'),
			c('potatoes', 'pomme-de-terre'),
			c('rice', 'riz')
		],
		medium: [
			c('200 g dried noodle', 'nouilles-aux-oeufs'),
			c('bries', 'brie'),
			c('500 ml beef chuck', 'paleron'),
			c('ciabattas', 'ciabatta'),
			c('2 walnut whole', 'noix', 'noix-de-grenoble'),
			c('french green bean', 'haricots-verts', 'haricot'),
			c('1 kg pecan', 'noix-de-pecan'),
			c('red fruit juice', 'jus-de-fruits-rouges'),
			c('3 pureed', 'puree'),
			c('quick oats', 'gruau'),
			c('250 ml coconutmilk', 'lait-de-coco'),
			c('anchovy', 'anchois')
		],
		hard: [
			c('2 tbsp ground cumin seed', 'cumin-en-poudre'),
			c('white pearl onion', 'oignon-blanc'),
			c('1 cup blueberry fruit spread', 'confiture-de-myrtilles'),
			c('sardine in oil', 'sardine'),
			c('3 cloves laughing cow cheese', 'vache-qui-rit'),
			c('fresh lime juice', 'jus-de-citrons-verts'),
			c('200 g rice vermicelli noodles', 'vermicelles-de-riz'),
			c('multigrain wheat bread', 'pain-aux-cereales'),
			c('lamb leg', 'gigot-d-agneau'),
			c('duck breast', 'magret-de-canard'),
			c('desiccated coconut', 'noix-de-coco-rapee'),
			c('2 tbsp of butter, melted', 'beurre')
		]
	},
	'fr-FR': {
		easy: [
			c('farine', 'farine'),
			c('sucre', 'sucre'),
			c('sel', 'sel'),
			c('oeufs', 'oeuf'),
			c('lait', 'lait'),
			c('beurre', 'beurre'),
			c("huile d'olive", 'huile-d-olive'),
			c('tomates', 'tomate'),
			c('oignons', 'oignon'),
			c("gousse d'ail", 'ail'),
			c('pommes de terre', 'pomme-de-terre'),
			c('riz', 'riz')
		],
		medium: [
			c('200 g double concentré tomates', 'double-concentre-de-tomates'),
			c('beurre demi sel', 'beurre-demi-sel'),
			c('500 ml tapenades', 'tapenade'),
			c('boudin artisanal', 'boudin'),
			c('2 rigatoni', 'rigatoni'),
			c('pâte à lasagne', 'pates-a-lasagnes'),
			c('1 kg ciabatta', 'ciabatta'),
			c('fraise sirop', 'sirop-de-fraises', 'sirop-de-fraise'),
			c('3 vin blanc tranquille', 'vin-blanc-sec'),
			c('coulis tomate', 'coulis-de-tomate'),
			c('250 ml bries', 'brie'),
			c('courge delica', 'courge')
		],
		hard: [
			c('2 tbsp riz à risottos', 'risotto'),
			c('jus de mangue', 'jus-de-mangue'),
			c("1 cup potiron sucré d'hiver", 'potimarron'),
			c('croissant pur beurre', 'croissant'),
			c('3 cloves filet de merlu', 'merlu'),
			c('sauge fraîche entière', 'sauge'),
			c('200 g carre de fromage frais', 'carre-frais'),
			c('bonbon au chocolat', 'bonbon-au-chocolat'),
			c('2 tranches de pain', 'pain'),
			c("gigot d'agneau", 'gigot-d-agneau'),
			c('noix de coco râpée', 'noix-de-coco-rapee'),
			c('200 g de farine', 'farine')
		]
	},
	'es-ES': {
		easy: [
			c('harina', 'farine'),
			c('azúcar', 'sucre'),
			c('sal', 'sel'),
			c('huevos', 'oeuf'),
			c('leche', 'lait'),
			c('mantequilla', 'beurre'),
			c('aceite de oliva', 'huile-d-olive'),
			c('tomates', 'tomate'),
			c('cebollas', 'oignon'),
			c('diente de ajo', 'ail'),
			c('papas', 'pomme-de-terre'),
			c('arroz', 'riz')
		],
		medium: [
			c('200 g jamón curado ahumado', 'jambon-fume'),
			c('hojaldrada', 'pate-feuilletee'),
			c('500 ml sal gorda', 'gros-sel'),
			c('chicharo', 'petits-pois', 'pois'),
			c('2 yogur batido', 'yaourt-brasse'),
			c('rigatonis', 'rigatoni'),
			c('1 kg galleta salada crujiente', 'cracker', 'biscuit-sale'),
			c('burdeos', 'bordeaux'),
			c('3 helados', 'glace'),
			c('hígado de ave', 'foie-de-volaille'),
			c('250 ml ciabatta', 'ciabatta'),
			c('cubito de caldo', 'cube-de-bouillon')
		],
		hard: [
			c('2 tbsp arroz tipo risotto', 'risotto'),
			c('verdura de hoja', 'legumes'),
			c('1 cup caramelo para decorar', 'bonbon-caramel', 'caramel', 'bonbon'),
			c('sardina en aceite', 'sardine'),
			c('3 cloves birra negra stout', 'biere'),
			c('menta de agua', 'menthe'),
			c('200 g bebida de soja', 'lait-de-soja'),
			c('helados de chocolate', 'glace-au-chocolat'),
			c('carne picada', 'boeuf-hache', 'rumsteak', 'viande-hachee'),
			c('coco rallado', 'noix-de-coco-rapee'),
			c('pierna de cordero', 'gigot-d-agneau'),
			c('2 dientes de ajo', 'ail')
		]
	},
	'pt-BR': {
		easy: [
			c('farinha', 'farine'),
			c('açúcar', 'sucre'),
			c('sal', 'sel'),
			c('ovos', 'oeuf'),
			c('leite', 'lait'),
			c('manteiga', 'beurre'),
			c('azeite de oliva', 'huile-d-olive'),
			c('tomates', 'tomate'),
			c('cebolas', 'oignon'),
			c('dente de alho', 'ail'),
			c('batatas', 'pomme-de-terre'),
			c('arroz', 'riz')
		],
		medium: [
			c('200 g caldo em cubos', 'cube-de-bouillon'),
			c('aveias', 'avoine'),
			c('500 ml pedaço de avelã', 'eclats-de-noisettes'),
			c('salsicha frankfurt', 'saucisse-de-francfort'),
			c('2 babybel', 'babybel'),
			c('ciabatta', 'ciabatta'),
			c('1 kg feijão-verde', 'haricots-plats'),
			c('refri', 'soda'),
			c('3 canelone', 'canneloni'),
			c('vinagre puro', 'vinaigre-blanc', 'vinaigre-d-alcool'),
			c('250 ml rigatoni', 'rigatoni'),
			c('chocolate com avelãs', 'chocolat-a-la-noisette', 'chocolat-aux-noisettes')
		],
		hard: [
			c("2 tbsp m&m's de amendoim", 'm-m-s-cacahuete'),
			c('adençante de cozinha', 'sucrine'),
			c('1 cup uva sem semente', 'raisin'),
			c('floco de aveia', 'flocons-d-avoine'),
			c('3 cloves massa para pão', 'pate-a-pain'),
			c('bife de contrafilé', 'faux-filet'),
			c('200 g leite condensado açucarado', 'lait-concentre-sucre'),
			c('moscatel de alexandria', 'muscat'),
			c('carne picada', 'rumsteak', 'boeuf-hache'),
			c('2 fatias de pão', 'pain'),
			c('coco ralado', 'noix-de-coco-rapee'),
			c('2 dentes de alho', 'ail')
		]
	},
	'de-DE': {
		easy: [
			c('mehl', 'farine'),
			c('zucker', 'sucre-fin', 'sucre', 'sucre-semoule'),
			c('salz', 'sel'),
			c('eier', 'oeuf'),
			c('milch', 'lait'),
			c('butter', 'beurre-doux', 'beurre-demi-sel', 'beurre'),
			c('olivenöl', 'huile-d-olive'),
			c('tomaten', 'tomate'),
			c('zwiebeln', 'oignon-jaune', 'oignon'),
			c('knoblauchzehe', 'ail'),
			c('kartoffeln', 'pomme-de-terre'),
			c('reis', 'riz', 'riz-blanc', 'riz-cereales')
		],
		medium: [
			c('200 g brie käse', 'brie'),
			c('pizza gewürz', 'epices-pour-pizza'),
			c('500 ml pfirsich', 'peche'),
			c('weiße schokolade', 'chocolat-blanc'),
			c('2 rigatoni', 'rigatoni'),
			c('erdbeereiscreme', 'glace-fraise'),
			c('1 kg ciabattas', 'ciabatta'),
			c('rosa garnele', 'crevette-rose'),
			c('3 limonadengetränke', 'limonade', 'soda'),
			c('babybel', 'babybel'),
			c('250 ml ingwerwurzel', 'gingembre'),
			c('blauwe traube', 'raisin-blanc')
		],
		hard: [
			c('2 tbsp walnuss nut kernel', 'cerneau-de-noix'),
			c('grieß für pudding', 'semoule'),
			c('1 cup hörnchen aus blätterteig', 'croissant'),
			c('parmesan gerieben form', 'parmesan-rape'),
			c('3 cloves vanilleeis mit schokostreuseln', 'glace-vanille'),
			c('schokolade mit nuss', 'chocolat-a-la-noisette', 'chocolat-aux-noisettes'),
			c('200 g fruchtsaft mit multivitaminen', 'jus-de-fruit-multivitamine'),
			c('gelber paprika schote', 'poivron-jaune'),
			c('lammkeule', 'gigot-d-agneau'),
			c('2 scheiben brot', 'pain'),
			c('kokosraspeln', 'noix-de-coco-rapee'),
			c('2 zehen knoblauch', 'ail')
		]
	},
	'it-IT': {
		easy: [
			c('farina', 'farine'),
			c('zucchero', 'sucre'),
			c('sale', 'sel'),
			c('uova', 'oeuf'),
			c('latte', 'lait'),
			c('burro', 'beurre'),
			c("olio d'oliva", 'huile-d-olive'),
			c('pomodori', 'tomate'),
			c('cipolle', 'oignon-frais', 'oignon'),
			c("spicchio d'aglio", 'ail'),
			c('patate', 'pomme-de-terre'),
			c('riso', 'riz-cereales', 'riz-blanc', 'riz')
		],
		medium: [
			c('200 g fagioli bianchi', 'haricots-blancs'),
			c('crema mandorle', 'puree-d-amande-complete-extra-douce-perl-amande'),
			c('500 ml cioccolato al caramello', 'chocolat-au-caramel'),
			c('formaggio al brie', 'brie'),
			c('2 pancette fumate', 'poitrine-fumee', 'bacon', 'lard-fume'),
			c('patata per purè', 'pommes-de-terre-a-puree'),
			c('1 kg rigatoncini', 'rigatoni'),
			c('ciabatte', 'ciabatta'),
			c('3 cubetto di ghiaccio', 'glacons'),
			c('lieviti', 'levure'),
			c('250 ml succo mirtillo', 'jus-de-cranberries'),
			c('fava secche', 'fevette', 'feves')
		],
		hard: [
			c('2 tbsp riso per minestra', 'risotto'),
			c('fungo champignon marrone', 'champignon-de-paris-brun'),
			c('1 cup parte bianca uovo', 'blanc-d-oeuf'),
			c('tortilla chips salata', 'chips-tortilla-salee'),
			c('3 cloves mostarda di digione', 'moutarde-de-dijon'),
			c('vino rosso secco', 'vin-rouge'),
			c('200 g sardina al naturale', 'sardine'),
			c('sorbetto alla frutta', 'sorbet'),
			c('carne tritata', 'boeuf-hache', 'rumsteak', 'viande-hachee'),
			c('2 fette di pane', 'pain'),
			c('cocco grattugiato', 'noix-de-coco-rapee'),
			c("2 spicchi d'aglio", 'ail')
		]
	},
	'nl-NL': {
		easy: [
			c('bloem', 'farine'),
			c('suiker', 'sucre'),
			c('zout', 'sel'),
			c('eieren', 'oeuf'),
			c('melk', 'lait'),
			c('boter', 'beurre-doux', 'beurre'),
			c('olijfolie', 'huile-d-olive'),
			c('tomaten', 'tomate'),
			c('uien', 'oignon-frais', 'oignon-blanc', 'oignon'),
			c('teentje knoflook', 'ail'),
			c('aardappelen', 'pomme-de-terre'),
			c('rijst', 'riz', 'riz-cereales', 'riz-long')
		],
		medium: [
			c('200 g bries', 'brie'),
			c('bruin volkoren', 'pain-complet', 'pain-de-mie-aux-cereales'),
			c('500 ml basterdsuiker bruin', 'cassonade'),
			c('rigatoni', 'rigatoni'),
			c('2 rode vruchtensap', 'jus-de-fruits-rouges'),
			c('witte druiven', 'raisin-blanc'),
			c('1 kg aardbei ijs', 'glace-fraise'),
			c('witte chocolade chip', 'copeaux-de-chocolat-blanc'),
			c('3 varkenslende', 'echine-de-porc'),
			c('babybel', 'babybel'),
			c('250 ml ciabatta', 'ciabatta'),
			c('kidneyboon', 'haricots-rouges')
		],
		hard: [
			c('2 tbsp paprika groen peper', 'poivron-vert', 'piment-vert'),
			c('citroensap vers geperst', 'jus-de-citrons', 'jus-de-citron'),
			c('1 cup tarwe bloem voor brood', 'farine-de-ble'),
			c('kabeljauw in blik', 'cabillaud', 'morue'),
			c('3 cloves volle melk vol', 'lait-ecreme'),
			c('rode bes jam', 'confiture'),
			c('200 g vermicelli van rijst', 'vermicelles-de-riz'),
			c('broodje met burger', 'petit-pain-a-burger'),
			c('lamskoteletten', 'cotelette-d-agneau', 'cote-d-agneau'),
			c('2 sneetjes brood', 'pain'),
			c('geraspte kokos', 'noix-de-coco-rapee'),
			c('2 teentjes knoflook', 'ail')
		]
	},
	'pt-PT': {
		easy: [
			c('farinha', 'farine'),
			c('açúcar', 'sucre-en-poudre', 'sucre'),
			c('sal', 'sel'),
			c('ovos', 'oeuf'),
			c('leite', 'lait'),
			c('manteiga', 'beurre', 'beurre-doux'),
			c('azeite', 'huile-d-olive'),
			c('tomates', 'tomate'),
			c('cebolas', 'oignon', 'oignon-frais'),
			c('dente de alho', 'ail'),
			c('batatas', 'pomme-de-terre'),
			c('arroz', 'riz', 'riz-cereales')
		],
		medium: [
			c('200 g fermento químico seco', 'levure-de-boulanger-seche'),
			c('chantili', 'creme-chantilly'),
			c('500 ml rigatoni', 'rigatoni'),
			c('salsicha frankfurt', 'saucisse-de-francfort'),
			c('2 tomates cherry', 'tomates-grappes', 'tomates-cerise'),
			c('sumo laranja', 'jus-d-orange'),
			c('1 kg ciabatta', 'ciabatta'),
			c('compal de laranja', 'confiture-d-orange', 'marmelade-d-orange'),
			c('3 canelone', 'canneloni'),
			c('vinagre cristal', 'vinaigre-d-alcool', 'vinaigre-blanc'),
			c('250 ml babybel', 'babybel'),
			c('trigo', 'ble')
		],
		hard: [
			c('2 tbsp pastel de croissant', 'croissant'),
			c('flocos de aveia integral', 'flocons-d-avoine'),
			c('1 cup polpa tomate concentrado', 'pulpe-de-tomate', 'passata'),
			c('caramelo em tablete', 'caramel'),
			c('3 cloves sumo de manga', 'jus-de-mangue'),
			c('uva de mesa', 'raisin'),
			c('200 g carne de novilho', 'boeuf'),
			c('leite gordo pasteurizado', 'lait-entier'),
			c('carne picada', 'boeuf-hache', 'rumsteak', 'viande-hachee'),
			c('2 fatias de pão', 'pain'),
			c('coco ralado', 'noix-de-coco-rapee'),
			c('2 dentes de alho', 'ail')
		]
	}
};

const REGRESSIONS: (BenchmarkCase & { lang: BenchmarkLang })[] = [
	{ lang: 'en-US', ...c('lamb leg', 'gigot-d-agneau') },
	{ lang: 'en-US', ...c('duck breast', 'magret-de-canard') },
	{ lang: 'en-US', ...c('lemon', 'citron') },
	{ lang: 'en-US', ...c('leeks', 'poireau') },
	{ lang: 'en-US', ...c('desiccated coconut', 'noix-de-coco-rapee') },
	{ lang: 'en-US', ...c('demerara sugar', 'sucre-de-canne') },
	{ lang: 'en-US', ...c('2 tbsp of butter, melted', 'beurre') },
	{ lang: 'fr-FR', ...c('2 tranches de pain', 'pain') },
	{ lang: 'de-DE', ...c('2 scheiben brot', 'pain') },
	{ lang: 'it-IT', ...c('2 fette di pane', 'pain') },
	{ lang: 'pt-BR', ...c('2 fatias de pão', 'pain') },
	{ lang: 'pt-PT', ...c('2 fatias de pão', 'pain') }
];

async function setupBenchmark() {
	const secret = env.SUPABASE_SECRET_KEY;
	if (!secret) return { ok: false as const, error: new Error('missing SUPABASE_SECRET_KEY') };
	const benchmarkClient = createClient<Database>(PUBLIC_SUPABASE_URL, secret);
	try {
		const { error } = await benchmarkClient.from('languages').select('id').limit(1);
		if (error) return { ok: false as const, error };
		return { ok: true as const, client: benchmarkClient };
	} catch (error) {
		return { ok: false as const, error };
	}
}

const dbProbe = await setupBenchmark();

if (!dbProbe.ok) {
	const reason = dbProbe.error instanceof Error ? dbProbe.error.message : String(dbProbe.error);
	console.warn(`[match-benchmark] skipping: local Supabase unavailable (${reason})`);
	describe.skip('ingredient matching benchmark (local supabase unavailable)', () => {
		it('placeholder', () => {
			expect(true).toBe(true);
		});
	});
} else {
	const client = dbProbe.client;

	async function topMatch(lang: BenchmarkLang, rawInput: string): Promise<string | null> {
		const queryText = preprocessIngredient(rawInput, lang);
		if (!queryText) return null;
		const { data, error } = await client.rpc('match_ingredient', {
			query_text: queryText,
			lang_code: lang,
			n_matches: 1
		});
		if (error) throw new Error(`match_ingredient(${lang}, "${rawInput}"): ${error.message}`);
		return data?.[0]?.slug ?? null;
	}

	async function evaluate(cases: BenchmarkCase[], lang: BenchmarkLang) {
		return Promise.all(
			cases.map(async (benchmarkCase) => {
				const predicted = await topMatch(lang, benchmarkCase.input);
				return {
					...benchmarkCase,
					predicted,
					correct: predicted !== null && benchmarkCase.expected.includes(predicted)
				};
			})
		);
	}

	describe('ingredient matching benchmark', () => {
		it('scores easy/medium/hard cases per language', async () => {
			const table: Array<Record<string, string | number>> = [];
			const byDifficulty = {
				easy: { correct: 0, total: 0 },
				medium: { correct: 0, total: 0 },
				hard: { correct: 0, total: 0 }
			};
			let totalCorrect = 0;
			let totalCases = 0;
			const misses: string[] = [];
			const languageScores: number[] = [];

			for (const lang of LANGS) {
				let langCorrect = 0;
				let langCases = 0;
				const row: Record<string, string | number> = { language: lang };

				for (const difficulty of ['easy', 'medium', 'hard'] as const) {
					const results = await evaluate(CASES[lang][difficulty], lang);
					const correct = results.filter((result) => result.correct).length;
					const accuracy = (correct / results.length) * 100;
					row[difficulty] = `${correct}/${results.length} (${accuracy.toFixed(1)}%)`;
					langCorrect += correct;
					langCases += results.length;
					byDifficulty[difficulty].correct += correct;
					byDifficulty[difficulty].total += results.length;

					for (const miss of results.filter((result) => !result.correct)) {
						misses.push(
							`${lang} [${difficulty}] "${miss.input}" -> ${miss.predicted ?? '∅'} (expected ${miss.expected.join(' | ')})`
						);
					}
				}

				const langAccuracy = (langCorrect / langCases) * 100;
				row.overall = `${langCorrect}/${langCases} (${langAccuracy.toFixed(1)}%)`;
				table.push(row);
				languageScores.push(langAccuracy);
				totalCorrect += langCorrect;
				totalCases += langCases;
			}

			const combined = (totalCorrect / totalCases) * 100;
			const formatDifficulty = (difficulty: keyof typeof byDifficulty) => {
				const { correct, total } = byDifficulty[difficulty];
				return `${correct}/${total} (${((correct / total) * 100).toFixed(1)}%)`;
			};
			table.push({
				language: 'ALL',
				easy: formatDifficulty('easy'),
				medium: formatDifficulty('medium'),
				hard: formatDifficulty('hard'),
				overall: `${totalCorrect}/${totalCases} (${combined.toFixed(1)}%)`
			});

			console.log('\nIngredient matching precision (top-1)\n');
			console.table(table);
			if (misses.length > 0) console.log('Misses:\n' + misses.join('\n'));

			for (const score of languageScores) expect(score).toBeGreaterThanOrEqual(80);
			expect(combined).toBeGreaterThanOrEqual(90);
		}, 120_000);

		it('matches the previously broken / prefix-collision cases', async () => {
			for (const regression of REGRESSIONS) {
				const predicted = await topMatch(regression.lang, regression.input);
				expect(
					regression.expected.includes(predicted ?? ''),
					`"${regression.input}" matched ${predicted ?? '∅'}, expected one of ${regression.expected.join(', ')}`
				).toBe(true);
			}
		});
	});
}
