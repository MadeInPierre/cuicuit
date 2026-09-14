import { z } from 'zod';

import type { Database } from '$lib/shared/db/supabase.types';
import { languageCodeSchema } from '$lib/shared/language.js';

import { OpError } from '../errors.js';
import { defineOp } from '../registry.js';

export const shoppingRecommendationsInput = z.object({
	spaceId: z.string().min(1),
	lang: languageCodeSchema
});

export type ShoppingRecommendationsInput = z.infer<typeof shoppingRecommendationsInput>;

type RecommendationsRpc =
	Database['public']['Functions']['get_shopping_recommendations']['Returns'];

export type ShoppingRecommendation = RecommendationsRpc[number];

const MAX_RECOMMENDATIONS = 600;
// Key count of `supermarketAisleSectionHeaders` (features/recipes/components/consts).
// Kept as a literal so core stays free of UI imports — update together.
const AISLE_COUNT = 11;
const PER_AISLE_LIMIT = Math.floor(MAX_RECOMMENDATIONS / AISLE_COUNT);

/**
 * Fetches shopping recommendations via the `get_shopping_recommendations` RPC.
 * Moved from `features/spaces/queries/get-shopping-recommendations.ts`.
 * Online-only (`server-only`): under PowerSync (M5) the last result is cached,
 * never replayed as row writes. Note the per-call random `seed`, so results are
 * intentionally non-idempotent.
 */
export const shoppingRecommendationsOp = defineOp({
	name: 'plans.recommendations',
	domain: 'plans',
	kind: 'rpc',
	sync: 'server-only',
	docs: {
		title: 'Get shopping recommendations',
		description: 'Fetches shopping recommendations for a space via RPC.'
	},
	input: shoppingRecommendationsInput,
	handler: async (ctx, { spaceId, lang }) => {
		const { data, error } = await ctx.supabase.rpc('get_shopping_recommendations', {
			space_id: spaceId,
			per_aisle_limit: PER_AISLE_LIMIT,
			limit: MAX_RECOMMENDATIONS,
			lang,
			seed: Math.random()
			// aisle: null // No aisle filter for now, but we can add it later if needed
		});
		if (error) {
			throw new OpError('INTERNAL', 'Failed to fetch shopping recommendations.', error);
		}

		return data ?? [];
	}
});

export type ShoppingRecommendationsOutput = ShoppingRecommendation[];
