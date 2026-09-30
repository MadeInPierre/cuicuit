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
			// Rejections are captured by our own listener below so that non-Error
			// rejections get a readable title before capture.
			capture_unhandled_rejections: false,
			capture_console_errors: true
		},
		logs: {
			captureConsoleLogs: true,
			serviceName: 'cuicuit-web',
			serviceVersion: version,
			environment: 'production'
		}
	});

	window.addEventListener('unhandledrejection', (event) => captureRejection(event.reason));
}

// A rejected SvelteKit remote function reaches the browser as a plain HttpError
// object ({ status, body }), not an Error. posthog-js then records it with no
// message, no stack, and a synthetic title such as "'f' captured as exception
// with keys: body, status". Rebuild it into a real Error so the issue is
// diagnosable, and forward every other rejection unchanged.
function captureRejection(reason: unknown) {
	if (!posthog.__loaded) return;

	const remote = normalizeRemoteError(reason);
	if (remote) {
		posthog.captureException(remote.error, remote.properties);
	} else {
		posthog.captureException(reason);
	}
}

function normalizeRemoteError(reason: unknown) {
	if (typeof reason !== 'object' || reason === null || reason instanceof Error) return;

	const { status, body } = reason as { status?: unknown; body?: unknown };
	if (typeof status !== 'number' || typeof body !== 'object' || body === null) return;

	const message = 'message' in body && typeof body.message === 'string' ? body.message : undefined;

	const error = new Error(
		message
			? `Remote function failed (${status}): ${message}`
			: `Remote function failed (${status})`
	);
	error.name = 'RemoteFunctionError';

	return {
		error,
		properties: { remote_function_status: status, remote_function_message: message }
	};
}

export const handleError: HandleClientError = ({ error }) => {
	if (posthog.__loaded) posthog.captureException(error);
};
