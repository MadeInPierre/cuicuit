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

/** Seeds granted per unit of currency paid: `private` to the supporter,
 * `public` to the shared community pool ("garden"). Keep in sync with
 * `billing.credit_conversion_rules`. */
export const SEEDS_PER_UNIT = { private: 20, public: 10 } as const;

/** Smallest payment accepted, because of payment fees. */
export const MIN_SUPPORT_AMOUNT = 3;
