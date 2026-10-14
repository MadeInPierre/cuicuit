import { dev } from '$app/env';
import { version } from '$app/environment';
import { env } from '$env/dynamic/public';
import type { HandleClientError } from '@sveltejs/kit';
import posthog from 'posthog-js';

export function init() {
	// The dev server reports errors and logs to the production PostHog project.
	// These dev-server events add noise and hide real user errors, so skip init
	// during development.
	if (dev) return;

	const token = env.PUBLIC_POSTHOG_PROJECT_TOKEN;
	const host = env.PUBLIC_POSTHOG_HOST;

	if (!token || !host) return;

	posthog.init(token, {
		api_host: host,
		ui_host: 'https://eu.posthog.com',
		defaults: '2025-05-24',
		capture_exceptions: {
			capture_unhandled_errors: true,
			capture_unhandled_rejections: true,
			capture_console_errors: true
		},
		logs: {
			captureConsoleLogs: true,
			serviceName: 'cuicuit-web',
			serviceVersion: version,
			environment: 'production'
		}
	});
}

export const handleError: HandleClientError = ({ error }) => {
	// Offline fetch failures are expected (DB layer is online-only for now) —
	// don't report them as exceptions.
	if (typeof navigator !== 'undefined' && !navigator.onLine) {
		const msg = error instanceof Error ? error.message : String(error);
		if (
			error instanceof TypeError ||
			msg.includes('fetch failed') ||
			msg.includes('Failed to fetch') ||
			msg.includes('NetworkError') ||
			msg.includes('Load failed')
		) {
			console.debug('Suppressed offline error:', msg);
			return;
		}
	}
	if (posthog.__loaded) posthog.captureException(error);
};
