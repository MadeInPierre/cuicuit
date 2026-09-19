/** Seed costs per paid feature. Keys must match the `credits.feature` set on
 * the corresponding core op — UI copy and MCP/API cost notes render from this. */
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
	}
} as const;

export type PaidFeatureKey = keyof typeof FEATURE_COSTS;
