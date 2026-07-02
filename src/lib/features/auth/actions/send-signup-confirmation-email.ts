import { supabase } from '$lib/shared/db/supabase-client.svelte';
import { toast } from 'svelte-sonner';

export async function resendConfirmationEmail() {
	return supabase.auth
		.resend({
			type: 'signup',
			email: 'email@example.com',
			options: {
				emailRedirectTo: 'https://example.com/welcome'
			}
		})
		.then(({ data, error }) => {
			if (error) {
				console.error('Error resending verification email:', error);
				toast.error('Could not resend verification email. Please try again later.');
			} else {
				toast.success('Verification email sent!', {
					description: 'Please click on the link inside the email before logging in.'
				});
			}
		});
}
