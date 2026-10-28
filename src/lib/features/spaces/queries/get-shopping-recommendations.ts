import { getClientCtx, runOp } from '$lib/core/operations/client.js';
import {
	shoppingRecommendationsOp,
	type ShoppingRecommendation as OpShoppingRecommendation,
	type ShoppingRecommendationsInput,
	type ShoppingRecommendationsOutput
} from '$lib/core/operations/plans/recommendations.js';
import type { LanguageCode } from '$lib/shared/language.js';

export async function getShoppingRecommendations(spaceId: string, lang: LanguageCode) {
	if (!spaceId) return [];
	return runOp<ShoppingRecommendationsInput, ShoppingRecommendationsOutput>(
		shoppingRecommendationsOp.name,
		await getClientCtx(),
		{ spaceId, lang }
	);
}

export type ShoppingRecommendation = OpShoppingRecommendation;
