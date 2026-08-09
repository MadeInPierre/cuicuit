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
