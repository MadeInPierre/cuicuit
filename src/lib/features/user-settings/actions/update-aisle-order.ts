import type { SupermarketAisleKey } from '$lib/features/recipes/components/consts';
import { supabase } from '$lib/shared/db/supabase-client.svelte';
import { toast } from 'svelte-sonner';

// Persist the user's preferred supermarket aisle display order
export async function updateAisleOrder(userId: string, aisleOrder: SupermarketAisleKey[]) {
	if (!supabase.client) throw new Error('No supabase client');
	if (!userId) return;

	const { error } = await supabase.client
		.from('user_preferences')
		.update({ aisle_order: aisleOrder })
		.eq('user_id', userId);

	if (error) {
		console.error('Error updating aisle order:', error);
		toast.error('Could not save aisle order. Please try again later.');
		throw error;
	}
}
