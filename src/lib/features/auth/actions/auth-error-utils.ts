import { toast } from 'svelte-sonner';
import { AuthMethod } from '../models/auth-method';
import { LogMethod } from '../models/log-method';

export const AUTH_CONTEXT = '[auth/signupOrLogin]';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
	invalid_credentials: 'Incorrect email or password. Please try again.',
	email_not_confirmed: 'Please verify your email before logging in.',
	weak_password: 'Your password is too weak. Please choose a stronger password.',
	provider_disabled: 'This sign-in provider is currently unavailable. Please try again later.',
	user_already_exists: 'An account already exists with this email.'
};

export class HandledAuthError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'HandledAuthError';
	}
}

export function getLogMethodLabel(logMethod: LogMethod): string {
	return LogMethod[logMethod] ?? String(logMethod);
}

export function getAuthMethodLabel(authMethod: AuthMethod): string {
	return AuthMethod[authMethod] ?? String(authMethod);
}

export function isHandledAuthError(error: unknown): error is HandledAuthError {
	return error instanceof HandledAuthError;
}

export function failHandled(logMessage: string, toastMessage: string): never {
	console.error(`${AUTH_CONTEXT} ${logMessage}`);
	toast.error(toastMessage);
	throw new HandledAuthError(logMessage);
}

export function assertEmailPasswordInputs(email: string, password: string): void {
	if (!email.trim() || !password) {
		failHandled(
			'Missing email or password for EMAIL_PASSWORD flow.',
			'Please enter an email and password to continue.'
		);
	}
}

export function getSupabaseErrorCode(error: unknown): string | undefined {
	if (typeof error === 'object' && error !== null && 'code' in error) {
		const code = (error as { code?: unknown }).code;
		return typeof code === 'string' ? code : undefined;
	}

	return undefined;
}

export function isSupabaseErrorCode(error: unknown, code: string): boolean {
	return getSupabaseErrorCode(error) === code;
}

export function getAuthErrorMessage(error: unknown, fallbackMessage: string): string {
	const code = getSupabaseErrorCode(error);
	if (code && AUTH_ERROR_MESSAGES[code]) {
		return AUTH_ERROR_MESSAGES[code];
	}

	return fallbackMessage;
}

export function handleUnknownAuthError(
	error: unknown,
	logMethodLabel: string,
	authMethodLabel: string
): never {
	console.error(
		`${AUTH_CONTEXT} Authentication flow failed for ${logMethodLabel}/${authMethodLabel}.`,
		error
	);

	if (error instanceof Error) {
		throw error;
	}

	throw new Error('Unknown authentication error.');
}
