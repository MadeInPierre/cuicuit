import type { ActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
import { supabase } from '$lib/shared/db/supabase-client.svelte';
import { capitalize } from '$lib/utils';

export async function addShoppingItem(
	space: ActiveSpaceState,
	ingredientId: string | null,
	name: string,
	quantity: number | null = null,
	unit: string | null = null
) {
	if (!supabase.client) throw new Error('No supabase client');
	if (!space.id || !space.activeMember?.user_id) return;

	await supabase.client.from('space_items').insert({
		space_id: space.id,
		created_by: space.activeMember.user_id,
		type: 'independent',
		ingredient_id: ingredientId,
		quantity: quantity,
		unit: unit,
		name: capitalize(name).trim(),
		priority: 'required'
	});

	// Update UI
	await space.refreshActivePlanItems();
}
