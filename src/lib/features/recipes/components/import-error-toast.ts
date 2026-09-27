import { WEEKLY_COMMUNITY_SEEDS_LIMIT } from '$lib/core/operations/credits';
import { toast } from 'svelte-sonner';

/**
 * Shared error toast for the recipe import forms. Weekly-limit hits get
 * their own message (wait for the reset) instead of the generic failure.
 * Detects `RATE_LIMITED` via the op error code when it survives remote
 * serialization, falling back to the message text. Reads `.message` off
 * plain objects too — remote errors may arrive without the Error prototype.
 */
export function toastImportError(error: unknown): void {
	const message = readMessage(error);
	const code = (error as { code?: unknown } | null)?.code;
	if (code === 'RATE_LIMITED' || message.includes('seed limit')) {
		toast.warning('Weekly fair usage limit reached', {
			description: `${WEEKLY_COMMUNITY_SEEDS_LIMIT} community seeds max.`
		});
		return;
	}
	toast.error('Failed to import recipe. Please try again.');
}

function readMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	if (
		typeof error === 'object' &&
		error !== null &&
		'message' in error &&
		typeof (error as { message: unknown }).message === 'string'
	) {
		return (error as { message: string }).message;
	}
	return String(error);
}
