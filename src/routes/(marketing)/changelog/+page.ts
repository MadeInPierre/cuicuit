import { getChangelogPosts } from '$lib/features/changelog/changelog';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = async () => {
	const posts = getChangelogPosts().map((p) => ({
		slug: p.slug,
		version: p.version,
		date: p.date,
		title: p.title,
		excerpt: p.excerpt,
		cover: p.cover
	}));
	return { posts };
};
