import { describe, expect, it } from 'vitest';

import { getUnseenPosts, parseChangelogFile, type ChangelogPost } from './changelog';

const RAW = `---
version: v0.2.0
date: 2026-10-18
title: 'Cookability badges'
excerpt: 'Know what you can cook.'
cover: /changelog/v0.2.0/hero.webp
---

## Hello

![hero](/changelog/v0.2.0/hero.webp)
`;

describe('parseChangelogFile', () => {
	it('parses frontmatter + renders markdown to html', () => {
		const post = parseChangelogFile('v0.2.0', RAW);
		expect(post).toMatchObject({
			slug: 'v0.2.0',
			version: 'v0.2.0',
			date: '2026-10-18',
			title: 'Cookability badges',
			excerpt: 'Know what you can cook.',
			cover: '/changelog/v0.2.0/hero.webp'
		});
		expect(post!.html).toContain('<h2>Hello</h2>');
		expect(post!.html).toContain('src="/changelog/v0.2.0/hero.webp"');
	});

	it('returns null without frontmatter (e.g. README.md)', () => {
		expect(parseChangelogFile('README', '# Just docs\n')).toBeNull();
	});

	it('returns null when required fields are missing', () => {
		expect(parseChangelogFile('x', '---\ntitle: Hi\n---\nbody')).toBeNull();
	});
});

describe('getUnseenPosts', () => {
	const posts = ['v0.3.0', 'v0.2.0', 'v0.1.0'].map(
		(v) => ({ slug: v, version: v, date: '2026-01-01', title: v }) as ChangelogPost
	);

	it('returns all posts when tag is null or unknown', () => {
		expect(getUnseenPosts(posts, null)).toHaveLength(3);
		expect(getUnseenPosts(posts, 'v9.9.9')).toHaveLength(3);
	});

	it('returns only newer posts', () => {
		expect(getUnseenPosts(posts, 'v0.2.0').map((p) => p.version)).toEqual(['v0.3.0']);
		expect(getUnseenPosts(posts, 'v0.3.0')).toHaveLength(0);
	});
});
