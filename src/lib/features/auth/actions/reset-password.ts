import { auth } from '$lib/shared/db/firebase-client';
import { sendPasswordResetEmail } from 'firebase/auth';
import { toast } from 'svelte-sonner';

export function resetPassword(email: string) {
	if (!auth) {
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

	sendPasswordResetEmail(auth, email)
		.then(() => {
			toast.success('Email sent!', {
				id: toastId,
				description: 'Click on the link there to reset your password.',
				duration: 20000
			});
		})
		.catch(() => {
			toast.error('Something went wrong...', {
				id: toastId,
				description: "Your email doesn't seem valid."
			});
		});
}
