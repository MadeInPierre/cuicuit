import { supabase } from '$lib/shared/db/supabase-client.svelte';
import { toast } from 'svelte-sonner';
import { AuthMethod } from '../../models/auth-method';
import { LogMethod } from '../../models/log-method';
import {
	assertEmailPasswordInputs,
	AUTH_CONTEXT,
	failHandled,
	getAuthErrorMessage,
	getLogMethodLabel,
	isSupabaseErrorCode
} from '../auth-error-utils';
import { onAuthSuccess } from '../on-auth-success';

interface EmailPasswordArgs {
	logMethod: LogMethod;
	email: string;
	password: string;
}

async function loginWithEmailPassword(email: string, password: string) {
	if (!supabase.client) throw new Error('No supabase client');

	const { data, error } = await supabase.client.auth.signInWithPassword({ email, password });

	if (error) {
		console.error(`${AUTH_CONTEXT} Login failed.`, error);
		failHandled(
			'Could not log in with email/password.',
			getAuthErrorMessage(error, 'Could not log in. Please check your credentials and try again.')
		);
	}

	if (!data.user) {
		failHandled('Login succeeded but no user returned.', 'Could not retrieve user after login.');
	}

	await onAuthSuccess(LogMethod.LOGIN, AuthMethod.EMAIL_PASSWORD, data.user);
}

async function signupWithEmailPassword(email: string, password: string) {
	if (!supabase.client) throw new Error('No supabase client');

	const { data, error } = await supabase.client.auth.signUp({
		email,
		password,
		options: {
			emailRedirectTo: '/welcome'
		}
	});

	if (error) {
		// If the user already exists, we can try to log them in instead of failing the signup
		if (isSupabaseErrorCode(error, 'user_already_exists')) {
			await loginWithEmailPassword(email, password);
			return { emailSent: false };
		}

		console.error(`${AUTH_CONTEXT} Sign-up failed.`, error);
		failHandled(
			'Could not sign up with email/password.',
			getAuthErrorMessage(error, 'Could not sign up. Please try again later.')
		);
	}

	if (!data.user) {
		failHandled(
			'Sign-up succeeded but no user returned.',
			'Could not retrieve your account. Please try again.'
		);
	}

	// If the user is new, they will receive a confirmation email. The session will be null until they confirm their email.
	const emailSent = !data.session;

	if (emailSent) {
		toast.success('Verification email sent!', {
			description: 'Please click on the link inside the email before logging in.'
		});

		return { emailSent: true };
	}

	await onAuthSuccess(LogMethod.SIGNUP, AuthMethod.EMAIL_PASSWORD, data.user);
	return { emailSent: false };
}

export async function handleEmailPasswordAuth({
	logMethod,
	email,
	password
}: EmailPasswordArgs): Promise<{ emailSent: boolean }> {
	assertEmailPasswordInputs(email, password);

	if (logMethod === LogMethod.LOGIN) {
		await loginWithEmailPassword(email, password);
		return { emailSent: false };
	} else if (logMethod === LogMethod.SIGNUP) {
		return await signupWithEmailPassword(email, password);
	}

	failHandled(
		`Unsupported log method for EMAIL_PASSWORD flow: ${getLogMethodLabel(logMethod)}.`,
		'This authentication mode is not available yet.'
	);
}
