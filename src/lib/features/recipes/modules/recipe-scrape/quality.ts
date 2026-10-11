/**
 * Quality gates used by the orchestrator to decide whether a strategy's raw
 * content is actually a recipe — otherwise we fall through to the next, more
 * expensive strategy.
 */
import type { ScrapeFormat } from './types';

const RECIPE_KEYWORDS = [
    'ingredient',
    'ingredients',
    'recipe',
    'direction',
    'directions',
    'preparation',
    'recette',
    'recettes',
    'ingrédient',
    'ingrédients',
    'préparation',
    'cuisson',
    'receta',
    'recetas',
    'ingrediente',
    'ingredientes',
    'preparación'
];

/** A JSON-LD node whose @type mentions "Recipe". */
export function isRecipeLdJson(node: unknown): boolean {
    if (!node || typeof node !== 'object') return false;
    const type = (node as Record<string, unknown>)['@type'];
    const types = Array.isArray(type) ? type : [type];
    return types.some((t) => typeof t === 'string' && t.toLowerCase().includes('recipe'));
}

/** A hand-shaped recipe object with a title + ingredients or instructions. */
export function looksLikeRecipeJson(content: unknown): boolean {
    if (!content || typeof content !== 'object') return false;
    const c = content as Record<string, unknown>;
    const title = typeof c.title === 'string' && c.title.trim().length > 0;
    const instructions = Array.isArray(c.recipeInstructions ?? c.instructions)
        ? (c.recipeInstructions ?? c.instructions)
        : [];
    const ingredients = Array.isArray(c.ingredients) ? c.ingredients : [];
    return Boolean(title && ((instructions as unknown[]).length > 0 || (ingredients as unknown[]).length > 0));
}

/** Loose heuristic: long enough + contains recipe-ish vocabulary (en/fr/es). */
export function markdownLooksLikeRecipe(text: string): boolean {
    const trimmed = text.trim();
    if (trimmed.length < 200) return false;
    const lower = trimmed.toLowerCase();
    return RECIPE_KEYWORDS.some((keyword) => lower.includes(keyword));
}

/** Parse + run the right gate for a given format. */
export function passesQualityGate(format: ScrapeFormat, content: string): boolean {
    switch (format) {
        case 'ldjson':
            try {
                return isRecipeLdJson(JSON.parse(content));
            } catch {
                return false;
            }
        case 'recipe-json':
            try {
                return looksLikeRecipeJson(JSON.parse(content));
            } catch {
                return false;
            }
        case 'markdown':
            return markdownLooksLikeRecipe(content);
        default:
            return false;
    }
}

// ==========================================
// Ingredient signals (strict gate for social captions)
// ==========================================
//
// The loose gate above only checks for recipe-ish *vocabulary* — a promo
// caption saying "get all my recipes in my cookbook" passes it while
// containing no actual recipe. Real recipe content (captions or transcripts)
// almost always states *quantities*, so we additionally look for
// quantity + unit pairs ("200g pasta", "2 cups flour", "3 oeufs").
// Social strategies use this to decide whether a caption alone is enough or
// a transcript must be fetched.

/** Digits: no trailing \b — digit→letter ("200g") has no word boundary. */
const DIGIT_PATTERN = '\\d+(?:[.,/]\\d+)*'; // 200, 1.5, 1,5 (fr), 1/2

const NUMBER_WORDS = [
    'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'half', 'dozen',
    'un', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six',
    'uno', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis',
    'a', 'an' // "a cup of flour", "a pinch of salt"
];

const QUANTITY_UNITS = [
    // Metric / imperial (en)
    'g', 'kg', 'mg', 'ml', 'l', 'dl', 'cl', 'oz', 'lb', 'cup', 'tbsp', 'tsp',
    'pinch', 'dash', 'clove', 'can', 'slice', 'scoop', 'handful', 'bunch', 'sprig',
    'stick', 'pack', 'packet', 'bottle', 'piece', 'cube', 'strip', 'stalk', 'fillet',
    // Common countable foods (en)
    'egg', 'onion', 'potato', 'tomato', 'avocado', 'lemon', 'lime', 'carrot',
    // fr
    'cuillère', 'tasse', 'gousse', 'pincée', 'tranche', 'boîte', 'sachet', 'morceau',
    'oeuf', 'œuf', 'oignon',
    // es
    'taza', 'cucharada', 'cucharadita', 'diente', 'pizca', 'lata', 'rebanada',
    'huevo', 'cebolla'
];

const QUANTITY_RE = new RegExp(
    `(?:${DIGIT_PATTERN}|\\b(?:${NUMBER_WORDS.join('|')})\\b)[\\s-]*(?:a\\s+)?(${QUANTITY_UNITS.join('|')})s?\\b`,
    'gi'
);

/** Counts quantity + unit pairs ("200g pasta", "2 cups flour"). URLs are ignored. */
export function countIngredientSignals(text: string): number {
    const withoutUrls = text.replace(/https?:\/\/\S+/gi, ' ');
    const matches = withoutUrls.match(QUANTITY_RE);
    return matches ? matches.length : 0;
}

/**
 * Strict recipe check: long enough + at least `min` quantity signals.
 * Used for social captions (early-exit decision) and transcript content
 * (which often never says the word "recipe"/"ingredients").
 */
export function markdownHasIngredientSignals(text: string, min = 2): boolean {
    return text.trim().length >= 100 && countIngredientSignals(text) >= min;
}
