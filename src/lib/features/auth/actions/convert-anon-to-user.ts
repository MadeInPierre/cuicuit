import { supabase } from '$lib/shared/db/supabase-client.svelte';
import { AuthMethod } from '../models/auth-method';
import type { LogMethod } from '../models/log-method';
import { AUTH_CONTEXT, failHandled, getAuthErrorMessage } from './auth-error-utils';
import { onAuthSuccess } from './on-auth-success';

export async function convertAnonToUser(
	logMethod: LogMethod,
	authMethod: AuthMethod,
	email: string,
	password: string
) {
	if (!supabase.client?.auth) throw new Error('Auth not found.');

	const {
		data: { user: currentUser },
		error: currentUserError
	} = await supabase.client.auth.getUser();

	if (currentUserError || !currentUser) {
		failHandled(
			'Anonymous conversion attempted without an authenticated user.',
			'Please log in first.'
		);
	}

	if (!currentUser.is_anonymous) {
		failHandled(
			'Anonymous conversion attempted for non-anonymous user.',
			'Your account is already permanent.'
		);
	}

	try {
		switch (authMethod) {
			case AuthMethod.EMAIL_PASSWORD:
				if (!email.trim() || !password) {
					failHandled(
						'Missing email or password for anonymous conversion.',
						'Please enter an email and password to continue.'
					);
				}

				const { data, error } = await supabase.client.auth.updateUser({ email, password });

				if (error) {
					console.error(`${AUTH_CONTEXT} Anonymous conversion to email/password failed.`, error);
					failHandled(
						'Could not convert anonymous account to email/password.',
						getAuthErrorMessage(error, 'Could not convert your account. Please try again later.')
					);
				}

				if (!data.user) {
					failHandled(
						'Anonymous conversion succeeded but no user returned.',
						'Could not retrieve your updated account. Please try again.'
					);
				}

				await onAuthSuccess(logMethod, authMethod, data.user);
				break;
			case AuthMethod.GOOGLE:
			case AuthMethod.GITHUB:
				failHandled(
					`Anonymous conversion with provider ${AuthMethod[authMethod]} is not implemented.`,
					'This conversion method is not available yet.'
				);
			case AuthMethod.EMAIL_LINK:
			case AuthMethod.ANONYMOUS:
				failHandled('Unsupported anonymous conversion auth method.', 'Unsupported operation.');
				break;
		}
	} catch (e) {
		console.error(`${AUTH_CONTEXT} Error converting anonymous user to permanent account:`, e);
		throw e;
	}
}
