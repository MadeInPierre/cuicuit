import { dev, version } from '$app/environment';
import { env } from '$env/dynamic/public';
import type { HandleClientError } from '@sveltejs/kit';
import posthog from 'posthog-js';

export function init() {
	const token = env.PUBLIC_POSTHOG_PROJECT_TOKEN;
	const host = env.PUBLIC_POSTHOG_HOST;

	if (!token || !host) {
		if (import.meta.env.DEV) {
			throw new Error(
				`${!token ? 'PUBLIC_POSTHOG_PROJECT_TOKEN' : 'PUBLIC_POSTHOG_HOST'} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${!token ? 'PUBLIC_POSTHOG_PROJECT_TOKEN' : 'PUBLIC_POSTHOG_HOST'} is configured`
			);
		}
		return;
	}

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
			environment: dev ? 'development' : 'production'
		}
	});
}

export const handleError: HandleClientError = ({ error }) => {
	if (posthog.__loaded) posthog.captureException(error);
};
