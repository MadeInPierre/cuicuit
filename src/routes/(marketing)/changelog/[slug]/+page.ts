import { error } from '@sveltejs/kit';
import { getChangelogPost } from '$lib/features/changelog/changelog';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = async ({ params }) => {
	const post = getChangelogPost(params.slug);
	if (!post) throw error(404, 'Post not found');
	return { post };
};
