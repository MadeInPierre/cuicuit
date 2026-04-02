import { supabase } from '$lib/shared/db/supabase-client';
import { AUTH_CONTEXT, failHandled, getAuthErrorMessage } from '../auth-error-utils';

interface GoogleOAuthArgs {
	redirectTo: string;
}

/**
 * Starts the Google OAuth redirect flow.
 *
 * Note: Supabase redirects to Google immediately, so user/session handling is performed
 * when the app returns from the OAuth callback (not in this function).
 */
export async function handleGoogleOAuth({ redirectTo }: GoogleOAuthArgs): Promise<void> {
	const { error } = await supabase.auth.signInWithOAuth({
		provider: 'google',
		options: {
			redirectTo
		}
	});

	if (error) {
		console.error(`${AUTH_CONTEXT} Google OAuth initiation failed.`, error);
		failHandled(
			'Could not start Google OAuth flow.',
			getAuthErrorMessage(error, 'Could not sign in with Google. Please try again later.')
		);
	}
}
