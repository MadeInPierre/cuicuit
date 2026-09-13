import { getClientCtx, runOp } from '$lib/core/operations/client.js';
import {
	shoppingRecommendationsOp,
	type ShoppingRecommendation as OpShoppingRecommendation,
	type ShoppingRecommendationsInput,
	type ShoppingRecommendationsOutput
} from '$lib/core/operations/plans/recommendations.js';

// Thin adapter over the `plans.recommendations` op. NOTE: the canonical operation
// lives in `core/operations/plans/recommendations.ts` (plans domain); this file
// stays in the spaces folder for history and re-exports its shape.

export async function getShoppingRecommendations(spaceId: string, lang: string) {
	if (!spaceId) return [];
	return runOp<ShoppingRecommendationsInput, ShoppingRecommendationsOutput>(
		shoppingRecommendationsOp.name,
		await getClientCtx(),
		{ spaceId, lang }
	);
}

export type ShoppingRecommendation = OpShoppingRecommendation;
