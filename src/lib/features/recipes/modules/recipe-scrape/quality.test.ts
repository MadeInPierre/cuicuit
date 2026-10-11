import { describe, expect, it } from 'vitest';

import {
    countIngredientSignals,
    markdownHasIngredientSignals,
    markdownLooksLikeRecipe,
    passesQualityGate
} from './quality';

// A promo-style caption: mentions "recipes" (passes the loose gate) but
// contains no actual recipe — only a gear mention with a quantity-like token.
const PROMO_CAPTION = `# These 15 Minute Lunches Will Change Your Life

Source: https://www.youtube.com/watch?v=7Yo54RiBUx0

Author: LifebyMikeG

## Caption
Get all of my "15 Minute Meal" recipes in my FREE Cookbook: https://prohomecooksu.com/15-minute-meals/

00:00 - Intro
00:31 - Tofu & Brocoli
07:53 - Crispy Chicken & Tortilla Salad

Shop the gear in this video below!
Cuisinart 14-Cup Food processor: https://amzn.to/39z8szL
Misen 8" chef knife: https://amzn.to/47pczLJ

The complete breakdown and recipes for this video on my blog.

Tags: 15 minute meals, quick meals, lunch ideas, tofu and broccoli`;

const RECIPE_CAPTION = `# Creamy Garlic Pasta

Source: https://www.tiktok.com/@cook/video/123

## Caption
Ingredients: 200g pasta, 2 eggs, 50g parmesan, 3 cloves of garlic. Add a cup of cream and a pinch of salt. Full recipe below!`;

const SPOKEN_TRANSCRIPT = `hey guys welcome back today we are making tofu and broccoli first chop 1 onion
add two cups of vegetable broth and 3 cloves of garlic then toss in 200g of tofu and let it simmer`;

describe('ingredient signals', () => {
    it('promo caption passes the loose gate but has no ingredient signals', () => {
        expect(passesQualityGate('markdown', PROMO_CAPTION)).toBe(true);
        expect(countIngredientSignals(PROMO_CAPTION)).toBeLessThan(2);
        expect(markdownHasIngredientSignals(PROMO_CAPTION)).toBe(false);
    });

    it('recipe caption has ingredient signals', () => {
        expect(markdownHasIngredientSignals(RECIPE_CAPTION)).toBe(true);
    });

    it('spoken transcript without recipe keywords still has signals', () => {
        expect(markdownLooksLikeRecipe(SPOKEN_TRANSCRIPT)).toBe(false);
        expect(markdownHasIngredientSignals(SPOKEN_TRANSCRIPT)).toBe(true);
    });

    it('ignores timestamps, urls and gear mentions', () => {
        expect(countIngredientSignals('00:31 - Intro, see https://amzn.to/39z8szL for 2 days only')).toBe(0);
        expect(countIngredientSignals('someone told me about this place')).toBe(0);
    });

    it('supports compact quantities and fr/es captions', () => {
        expect(countIngredientSignals('200g de farine, 3 oeufs, une tasse de lait')).toBeGreaterThanOrEqual(2);
        expect(countIngredientSignals('2 huevos, una taza de harina, 100ml de leche')).toBeGreaterThanOrEqual(2);
    });
});
