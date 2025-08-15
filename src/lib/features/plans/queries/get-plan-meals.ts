import { supabase } from '$lib/shared/db/supabase-client';

export async function getPlanMeals(spaceId: string) {
	if (!supabase) throw new Error('Supabase client not available');
	if (!spaceId) throw new Error('Space ID not provided');

	const { data, error } = await supabase
		.from('space_plan_meals')
		.select('*')
		.eq('space_id', spaceId);

	if (error) throw new Error('Error fetching plan meals: ' + error.message);
	return data;
}
