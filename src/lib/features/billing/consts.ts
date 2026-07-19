export const FEATURE_COSTS = {
	import_recipe_from_website: {
		name: 'Import a recipe from a website',
		seeds: 1,
		comingSoon: false
	},
	import_recipe_from_photo: { name: 'Scan a recipe from photos', seeds: 2, comingSoon: false },
	sooon1: { name: 'Never gonna give you up, never', seeds: 4, comingSoon: true },
	soon2: { name: 'Gonna let you down, never', seeds: 2, comingSoon: true },
	soon3: { name: 'Gonna run around', seeds: 1, comingSoon: true }
} as const;
