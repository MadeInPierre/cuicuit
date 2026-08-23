import { dev, version } from '$app/environment';
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
		// Backstop that does not depend on the bundler: drop any event from a
		// local host, so a broken dev guard cannot send dev noise to production.
		before_send: (event) => {
			if (!event) return event;
			const host = URL.parse(event.properties?.$current_url ?? '')?.hostname;
			if (host === 'localhost' || host === '127.0.0.1') return null;
			return event;
		},
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
	if (posthog.__loaded) posthog.captureException(error);
};
