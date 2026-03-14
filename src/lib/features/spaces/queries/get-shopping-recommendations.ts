import { supabase } from '$lib/shared/db/supabase-client';

export async function getShoppingRecommendations(spaceId: string) {
	if (!spaceId) return [];

	const { data, error } = await supabase.rpc('get_shopping_recommendations', {
		space_id: spaceId
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
