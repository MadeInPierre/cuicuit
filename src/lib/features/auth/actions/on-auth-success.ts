import { sendEmailVerification, signOut, type UserCredential } from 'firebase/auth';
import { AuthMethod } from '../models/auth-method';
import { dbCreateUserDoc } from '../db/create-user-doc';
import { LogMethod } from '../models/log-method';
import { goto } from '$app/navigation';
import { toast } from 'svelte-sonner';
import { auth } from '$lib/shared/db/firebase-client';

/**
 * Handle a new signed in user coming from any source (after signup or signin, any provider)
 * @param logMethod If we just logged in or signed up (or converted an anonymous account in the user settings page)
 * @param authMethod What auth method the user used to sign in (e.g. anonymous, email/password, Google, etc.)
 * @param credentials The user credentials returned by the auth provider
 * @returns
 */
export async function onAuthSuccess(
	logMethod: LogMethod,
	authMethod: AuthMethod,
	credentials: UserCredential
) {
	// Create a new user doc if they're a new user
	const createdUserDoc = await dbCreateUserDoc(credentials);

	// Make sure a non-anonymous user has a verified email
	if (authMethod !== AuthMethod.ANONYMOUS && !credentials.user.emailVerified) {
		// Show a reminder if the user still didn't verify their email on login
		if (logMethod == LogMethod.LOGIN || logMethod == LogMethod.CONVERT_ANONYMOUS) {
			toast.error('Please verify your email first.', {
				duration: 60000,
				description:
					'Click on the link you received by email to activate your account. Check your spam folder 👀',
				action: {
					label: 'Resend',
					onClick: () => {
						sendEmailVerification(credentials.user).then(() => {
							toast.success('Verification email sent!', {
								description: 'Please click on the link inside the email before logging in.'
							});
						});
					}
				}
			});
		}

		// Forbid the user to sign-in without verified email, sign them out
		if (auth) {
			signOut(auth);
		} else {
			toast.error('Could not sign out.', {
				description: 'Something went wrong, please try again later.'
			});
		}

		goto('/login');
		return;
	}

	// Valid user with verified email, welcome them if they're new or go to dashboard
	if (createdUserDoc) {
		goto('/welcome');
	} else {
		goto('/dashboard');
	}
}
