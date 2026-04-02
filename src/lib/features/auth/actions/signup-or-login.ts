import { supabase } from '$lib/shared/db/supabase-client';
import { toast } from 'svelte-sonner';
import { AuthMethod } from '../models/auth-method';
import { LogMethod } from '../models/log-method';
import {
	AUTH_CONTEXT,
	failHandled,
	getAuthMethodLabel,
	getLogMethodLabel,
	handleUnknownAuthError,
	isHandledAuthError
} from './auth-error-utils';
import { handleEmailPasswordAuth } from './handlers/email-password-handler';
import { handleGoogleOAuth } from './handlers/google-oauth-handler';

export { AuthMethod, LogMethod };

/**
 * Sign up or log in the user with the given email and password.
 * @param logMethod Action: login, signup or convert anonymous
 * @param authMethod Method: email/password, email link, google, github or anonymous
 * @param email: Email if email/password or email link
 * @param password Password if email/password
 * @returns
 */
export async function signupOrLogin(
	logMethod: LogMethod,
	authMethod: AuthMethod,
	email: string,
	password: string
): Promise<{ emailSent: boolean }> {
	if (!supabase.auth) {
		console.error(`${AUTH_CONTEXT} Supabase auth client is not available.`);
		throw new Error('Auth not found.');
	}

	const logMethodLabel = getLogMethodLabel(logMethod);
	const authMethodLabel = getAuthMethodLabel(authMethod);
	console.info(`${AUTH_CONTEXT} Starting ${logMethodLabel} with ${authMethodLabel}.`);

	let emailSent = false;

	try {
		switch (authMethod) {
			case AuthMethod.EMAIL_PASSWORD:
				emailSent = (
					await handleEmailPasswordAuth({
						logMethod,
						authMethod,
						email,
						password,
						logMethodLabel
					})
				).emailSent;
				break;
			case AuthMethod.GOOGLE:
				await handleGoogleOAuth({
					redirectTo: `${window.location.origin}/recipes`
				});
				break;
			case AuthMethod.EMAIL_LINK:
			case AuthMethod.GITHUB:
			case AuthMethod.ANONYMOUS:
				failHandled(
					`Auth method not implemented: ${authMethodLabel}.`,
					'This sign-in method is not available yet.'
				);
				break;
			default:
				failHandled(
					`Unknown auth method: ${String(authMethod)}.`,
					'Unsupported authentication method.'
				);
		}
	} catch (error) {
		if (isHandledAuthError(error)) {
			throw error;
		}

		handleUnknownAuthError(error, logMethodLabel, authMethodLabel);
	}

	return {
		emailSent
	};
}
