import type { ActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
import { supabase } from '$lib/shared/db/supabase-client';
import { capitalize } from '$lib/utils';

export async function addShoppingItem(
	activeSpace: ActiveSpaceState,
	ingredientId: string | null,
	name: string,
	quantity: number | null = null,
	unit: string | null = null
) {
	if (!activeSpace.id) return;
	await supabase.from('space_plan_shopping_lists').insert({
		space_id: activeSpace.id,
		type: 'independent',
		ingredient_id: ingredientId,
		quantity: quantity,
		unit: unit,
		name: capitalize(name).trim()
	});

	// Update UI
	await activeSpace.refreshActivePlanItems();
}
