import type { ProfileFormSchema } from '$lib/features/auth/models/schemas';
import { supabase } from '$lib/shared/db/supabase-client.svelte';
import { toast } from 'svelte-sonner';
import type { Infer } from 'sveltekit-superforms';

// Triggered when a valid profile form is submitted, updates supabase
export async function updateUserPreferences(userId: string, newProfile: Infer<ProfileFormSchema>) {
	if(!supabase.client) throw new Error("No supabase client");
	if (!userId) return;

	if (!newProfile.firstName && !newProfile.lastName && !newProfile.userName) {
		throw new Error('Missing profile information');
	}

	// Update the user profile info in supabase (ignore empty fields)
	const { error } = await supabase.client
		.from('user_preferences')
		.update({
			first_name: newProfile.firstName,
			last_name: newProfile.lastName
		})
		.eq('user_id', userId);

	if (error) {
		console.error('Error updating user profile:', error);
		toast.error('Could not update profile. Please try again later.');
		throw error;
	}
}
