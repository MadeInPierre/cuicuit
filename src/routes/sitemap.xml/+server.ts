import { getChangelogPosts } from '$lib/features/changelog/changelog';
import { siteConfig } from '$lib/shared/config/site-config';
import type { RequestHandler } from './$types';

export const prerender = true;

interface Entry {
	path: string;
	lastmod?: string;
	changefreq: 'daily' | 'weekly' | 'monthly';
	priority: string;
}

function escapeXml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

export const GET: RequestHandler = () => {
	const entries: Entry[] = [
		{ path: '/', changefreq: 'weekly', priority: '1.0' },
		{ path: '/changelog', changefreq: 'weekly', priority: '0.8' },
		{ path: '/supporter', changefreq: 'monthly', priority: '0.5' },
		...getChangelogPosts().map((post) => ({
			path: `/changelog/${post.slug}`,
			lastmod: post.date,
			changefreq: 'monthly' as const,
			priority: '0.6'
		}))
	];

	const urls = entries
		.map(
			(entry) => `	<url>
		<loc>${escapeXml(siteConfig.url + entry.path)}</loc>${
			entry.lastmod ? `\n		<lastmod>${escapeXml(entry.lastmod)}</lastmod>` : ''
		}
		<changefreq>${entry.changefreq}</changefreq>
		<priority>${entry.priority}</priority>
	</url>`
		)
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

	return new Response(xml, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
};
