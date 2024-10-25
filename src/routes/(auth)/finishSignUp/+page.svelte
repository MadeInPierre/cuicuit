<script lang="ts">
	/// This page is visited when a user clicks on a magic email link to sign in.

	import { goto } from '$app/navigation';
	import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
	import { onMount } from 'svelte';
	import { auth } from '$lib/shared/db/firebase-client';
	import { dbCreateUserDoc } from '$lib/features/auth/db/create-user-doc';

	onMount(async () => {
		if (!auth) {
			goto('/');
			return;
		}

		// Confirm the link is a sign-in with email link.
		if (isSignInWithEmailLink(auth, window.location.href)) {
			// Additional state parameters can also be passed via URL.
			// This can be used to continue the user's intended action before triggering
			// the sign-in operation.
			// Get the email if available. This should be available if the user completes
			// the flow on the same device where they started it.
			let email = window.localStorage.getItem('emailForSignIn');
			while (!email) {
				// User opened the link on a different device. To prevent session fixation
				// attacks, ask the user to provide the associated email again. For example:
				email = window.prompt('Please provide your email for confirmation');
			}

			// The client SDK will parse the code from the link for you.
			signInWithEmailLink(auth, email, window.location.href)
				.then((credential) => {
					// Clear email from storage.
					window.localStorage.removeItem('emailForSignIn');

					// You can access the new user via result.user
					// Additional user info profile not available via:
					// result.additionalUserInfo.profile == null
					// You can check if the user is new or existing:
					// result.additionalUserInfo.isNewUser

					dbCreateUserDoc(credential);
					goto('/');
				})
				.catch((error) => {
					// Some error occurred, you can inspect the code: error.code
					// Common errors could be invalid email and invalid or expired OTPs.
					console.log('ERROR', error);
				});
		}
	});
</script>
