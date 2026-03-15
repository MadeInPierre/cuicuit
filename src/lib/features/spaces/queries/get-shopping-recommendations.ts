import { supermarketAisleSectionHeaders } from '$lib/features/recipes/components/consts';
import { supabase } from '$lib/shared/db/supabase-client';

const MAX_RECOMMENDATIONS = 600;
const PER_AISLE_LIMIT = Math.floor(
	MAX_RECOMMENDATIONS / Object.keys(supermarketAisleSectionHeaders).length
);

export async function getShoppingRecommendations(spaceId: string) {
	if (!spaceId) return [];

	const { data, error } = await supabase.rpc('get_shopping_recommendations', {
		space_id: spaceId,
		per_aisle_limit: PER_AISLE_LIMIT,
		limit: MAX_RECOMMENDATIONS,
		lang: 'fr-FR',
		seed: Math.random()
		// aisle: null // No aisle filter for now, but we can add it later if needed
	});
	if (error) throw error;

	console.log(
		`Fetched ${data?.length || 0} shopping recommendations for space ${spaceId} with ${MAX_RECOMMENDATIONS} max and ${PER_AISLE_LIMIT} per aisle.`
	);

	return data || [];
}

export type ShoppingRecommendation =
	ReturnType<typeof getShoppingRecommendations> extends Promise<infer T>
		? T extends Array<infer U>
			? U
			: never
		: never;
