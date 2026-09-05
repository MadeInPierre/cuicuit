import type { LanguageKey } from '$lib/features/user-settings/consts';

// Hard-coded, well-known recipe URLs whose scrape + enrichment results are
// already stored in the shared cache, so adding them to a user's space is free
// (no scraping, no LLM call, no credits). Keyed by language so each locale gets
// its own curated set; a space falls back to 'fr-FR' when its language has no
// dedicated list yet.
export const EXAMPLE_RECIPE_URLS: Partial<Record<LanguageKey, readonly string[]>> = {
	'fr-FR': [
		'https://www.marmiton.org/recettes/recette_salade-grecque_34399.aspx',
		'https://www.cuisineaz.com/recettes/ramen-au-poulet-105611.aspx',
		'https://www.marmiton.org/recettes/recette_couscous-poulet-et-merguez-facile_17751.aspx',
		'https://www.marmiton.org/recettes/recette_carbonara-traditionnelle_340808.aspx',
		'https://www.marmiton.org/recettes/recette_lasagnes-a-la-bolognaise_18215.aspx',
		'https://www.marmiton.org/recettes/recette_tiramisu-recette-originale_12023.aspx',
		'https://www.marmiton.org/recettes/recette_brownies_16951.aspx',
		'https://www.marmiton.org/recettes/recette_the-tarte-au-citron-meringuee_22082.aspx'
	],
	// TODO: adapt other languages
	'en-US': [
		'https://www.marmiton.org/recettes/recette_salade-grecque_34399.aspx',
		'https://www.cuisineaz.com/recettes/ramen-au-poulet-105611.aspx',
		'https://www.marmiton.org/recettes/recette_couscous-poulet-et-merguez-facile_17751.aspx',
		'https://www.marmiton.org/recettes/recette_carbonara-traditionnelle_340808.aspx',
		'https://www.marmiton.org/recettes/recette_lasagnes-a-la-bolognaise_18215.aspx',
		'https://www.marmiton.org/recettes/recette_tiramisu-recette-originale_12023.aspx',
		'https://www.marmiton.org/recettes/recette_brownies_16951.aspx',
		'https://www.marmiton.org/recettes/recette_the-tarte-au-citron-meringuee_22082.aspx'
	],
	'es-ES': [
		'https://www.marmiton.org/recettes/recette_salade-grecque_34399.aspx',
		'https://www.cuisineaz.com/recettes/ramen-au-poulet-105611.aspx',
		'https://www.marmiton.org/recettes/recette_couscous-poulet-et-merguez-facile_17751.aspx',
		'https://www.marmiton.org/recettes/recette_carbonara-traditionnelle_340808.aspx',
		'https://www.marmiton.org/recettes/recette_lasagnes-a-la-bolognaise_18215.aspx',
		'https://www.marmiton.org/recettes/recette_tiramisu-recette-originale_12023.aspx',
		'https://www.marmiton.org/recettes/recette_brownies_16951.aspx',
		'https://www.marmiton.org/recettes/recette_the-tarte-au-citron-meringuee_22082.aspx'
	],
	'pt-BR': [
		'https://www.marmiton.org/recettes/recette_salade-grecque_34399.aspx',
		'https://www.cuisineaz.com/recettes/ramen-au-poulet-105611.aspx',
		'https://www.marmiton.org/recettes/recette_couscous-poulet-et-merguez-facile_17751.aspx',
		'https://www.marmiton.org/recettes/recette_carbonara-traditionnelle_340808.aspx',
		'https://www.marmiton.org/recettes/recette_lasagnes-a-la-bolognaise_18215.aspx',
		'https://www.marmiton.org/recettes/recette_tiramisu-recette-originale_12023.aspx',
		'https://www.marmiton.org/recettes/recette_brownies_16951.aspx',
		'https://www.marmiton.org/recettes/recette_the-tarte-au-citron-meringuee_22082.aspx'
	]
};
