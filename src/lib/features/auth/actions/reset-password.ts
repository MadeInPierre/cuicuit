import { supabase } from '$lib/shared/db/supabase-client';
import { toast } from 'svelte-sonner';

export async function resetPassword(email: string) {
	if (!supabase.auth) {
		console.error('Error: Auth not found.');
		return;
	}

	if (!email) {
		toast.error('Please enter your email.', {
			description: 'Then click again to send a reset link.'
		});
		return;
	}

	const toastId = toast.loading('Sending email...');

	const { error } = await supabase.auth.resetPasswordForEmail(email);

	if (!error) {
		toast.success('Email sent!', {
			id: toastId,
			description: 'Click on the link there to reset your password.',
			duration: 20000
		});
	} else {
		toast.error('Something went wrong...', {
			id: toastId,
			description: "Your email doesn't seem valid."
		});
	}
}
