import { goto } from '$app/navigation';
import { supabase } from '$lib/shared/db/supabase-client';
import type { User } from '@supabase/supabase-js';
import { toast } from 'svelte-sonner';
import { AuthMethod } from '../models/auth-method';
import { LogMethod } from '../models/log-method';
import { userState } from '../state/user-state.svelte';
import { resendConfirmationEmail } from './send-signup-confirmation-email';

/**
 * Handle a new signed in user coming from any source (after signup or signin, any provider)
 * @param logMethod If we just logged in or signed up (or converted an anonymous account in the user settings page)
 * @param authMethod What auth method the user used to sign in (e.g. anonymous, email/password, Google, etc.)
 * @param credentials The user credentials returned by the auth provider
 * @returns
 */
export async function onAuthSuccess(logMethod: LogMethod, authMethod: AuthMethod, user: User) {
	// Make sure a non-anonymous user has a verified email
	if (authMethod !== AuthMethod.ANONYMOUS && !user.email_confirmed_at) {
		// Show a reminder if the user still didn't verify their email on login
		if (logMethod == LogMethod.LOGIN || logMethod == LogMethod.CONVERT_ANONYMOUS) {
			toast.error('Please verify your email first.', {
				duration: 60000,
				description:
					'Click on the link you received by email to activate your account. Check your spam folder 👀',
				action: {
					label: 'Resend',
					onClick: () => {
						resendConfirmationEmail();
					}
				}
			});
		}

		// Forbid the user to sign-in without verified email, sign them out
		if (supabase.auth) {
			await supabase.auth.signOut();
			toast.error('Please verify your email first.', {
				duration: 60000,
				description:
					'Click on the link you received by email to activate your account. Check your spam folder 👀',
				action: {
					label: 'Resend',
					onClick: () => {
						resendConfirmationEmail();
					}
				}
			});
			return;
		} else {
			toast.error('Could not sign out.', {
				description: 'Something went wrong, please refresh the page.'
			});
		}

		console.warn('User tried to sign in before verifying their email, going back to login.');
		goto('/login');
		return;
	}

	// On signup, create initial user data in Supabase
	if (logMethod === LogMethod.SIGNUP) {
		console.log('New user, going to welcome page.');
		await userState.refresh(); // Refresh the user state to get the new data
		goto('/welcome'); // If the user is new, go to the welcome page
	}

	// Valid user with verified email, welcome them if they're new or go to the app
	else if (logMethod === LogMethod.LOGIN) {
		console.log('Existing user, going to app.');
		await userState.refresh(); // Refresh the user state to get the new data
		goto('/recipes'); // If the user is not new, go to the app
	}

	// TODO: Implement anonymous account conversion flow
	else if (logMethod === LogMethod.CONVERT_ANONYMOUS) {
		throw new Error(
			'Not implemented yet: converting an anonymous account to a registered account.'
		);
	}
}
