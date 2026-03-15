import { supabase } from '$lib/shared/db/supabase-client';

export async function getShoppingRecommendations(spaceId: string) {
	if (!spaceId) return [];

	const { data, error } = await supabase.rpc('get_shopping_recommendations', {
		space_id: spaceId,
		limit: 200,
		per_aisle_limit: 30,
		lang: 'fr-FR',
		seed: Math.random()
		// aisle: null // No aisle filter for now, but we can add it later if needed
	});
	if (error) throw error;

	return data || [];
}

export type ShoppingRecommendation =
	ReturnType<typeof getShoppingRecommendations> extends Promise<infer T>
		? T extends Array<infer U>
			? U
			: never
		: never;
