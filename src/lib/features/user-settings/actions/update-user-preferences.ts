import { getClientCtx, OpError, runOp } from '$lib/core/operations/client.js';
import '$lib/core/operations/profile/update-preferences.js';
import type { ProfileUpdatePreferencesInput } from '$lib/core/operations/profile/update-preferences.js';
import type { ProfileFormSchema } from '$lib/features/auth/models/schemas';
import { toast } from 'svelte-sonner';
import type { Infer } from 'sveltekit-superforms';

/**
 * Thin client adapter over the `profile.update-preferences` op (M2 core migration).
 * Same name and signature — `ProfileForm` unchanged. Failure toast preserved.
 */
// Triggered when a valid profile form is submitted, updates supabase
export async function updateUserPreferences(userId: string, newProfile: Infer<ProfileFormSchema>) {
	if (!userId) return;

	if (!newProfile.firstName && !newProfile.lastName && !newProfile.userName) {
		throw new OpError('VALIDATION', 'Missing profile information');
	}

	try {
		await runOp<ProfileUpdatePreferencesInput, void>(
			'profile.update-preferences',
			await getClientCtx(),
			{
				userId,
				firstName: newProfile.firstName,
				lastName: newProfile.lastName
			}
		);
	} catch (error) {
		console.error('Error updating user profile:', error);
		toast.error('Could not update profile. Please try again later.');
		throw error;
	}
}
