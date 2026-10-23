import { siteConfig } from '$lib/shared/config/site-config';
import type { RequestHandler } from './$types';

export const prerender = true;

/**
 * Private areas of the app (auth-gated, API, internal tools). They carry a
 * `noindex` meta tag too, but disallowing them here keeps crawlers out of
 * routes that only resolve to a login redirect.
 */
const PRIVATE_PREFIXES = [
	'/api/',
	'/mcp',
	'/admin',
	'/settings',
	'/recipes',
	'/plan',
	'/shopping-list',
	'/cookbooks',
	'/pantry',
	'/chat',
	'/whats-new',
	'/shared-content-receiver',
	'/app-shell',
	'/cards',
	'/landing-old',
	'/welcome',
	'/login',
	'/signup',
	'/verify',
	'/confirm',
	'/logout',
	'/join/'
];

export const GET: RequestHandler = () => {
	const lines = [
		'User-agent: *',
		'Allow: /',
		...PRIVATE_PREFIXES.map((path) => `Disallow: ${path}`),
		'',
		`Sitemap: ${siteConfig.url}/sitemap.xml`,
		''
	];

	return new Response(lines.join('\n'), {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
};
