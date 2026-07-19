export const FEATURE_COSTS = {
	import_recipe_from_website: {
		name: 'Import a recipe from a website',
		seeds: 1,
		comingSoon: false,
		display: true
	},
	import_recipe_from_text: {
		name: 'Import a recipe from any text',
		seeds: 1,
		comingSoon: false,
		display: false
	},
	import_recipe_from_photo: {
		name: 'Scan a recipe from photos',
		seeds: 2,
		comingSoon: false,
		display: true
	},

	// Tmp
	sooon1: { name: 'Never gonna give you up, never', seeds: 4, comingSoon: true, display: true },
	soon2: { name: 'Gonna let you down, never', seeds: 2, comingSoon: true, display: true },
	soon3: { name: 'Gonna run around', seeds: 1, comingSoon: true, display: true }
} as const;

export type PaidFeatureKey = keyof typeof FEATURE_COSTS;
