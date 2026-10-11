import { marked } from 'marked';

export interface ChangelogPost {
	slug: string;
	version: string;
	date: string;
	title: string;
	excerpt: string;
	cover: string | null;
	/** Rendered HTML (trusted: authored in-repo, rendered with `marked`). */
	html: string;
}

/** Raw markdown modules, bundled at build time. Works in app + marketing + prerender. */
const modules = import.meta.glob('/src/content/changelog/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

/** Minimal frontmatter parser (no dependency): `---\nkey: value\n---\nbody`. */
export function parseChangelogFile(slug: string, raw: string): ChangelogPost | null {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	if (!match) return null;
	const [, front, body] = match;
	const meta: Record<string, string> = {};
	for (const line of front.split(/\r?\n/)) {
		const sep = line.indexOf(':');
		if (sep === -1) continue;
		const key = line.slice(0, sep).trim();
		let value = line.slice(sep + 1).trim();
		if (
			(value.startsWith("'") && value.endsWith("'")) ||
			(value.startsWith('"') && value.endsWith('"'))
		) {
			value = value.slice(1, -1);
		}
		meta[key] = value;
	}
	if (!meta.version || !meta.date || !meta.title) return null;
	return {
		slug,
		version: meta.version,
		date: meta.date,
		title: meta.title,
		excerpt: meta.excerpt ?? '',
		cover: meta.cover ?? null,
		html: marked.parse(body.trim()) as string
	};
}

function slugOf(path: string): string {
	return path.split('/').pop()!.replace(/\.md$/, '');
}

let cache: ChangelogPost[] | null = null;

/** All posts, newest first. `README.md` has no frontmatter and is skipped. */
export function getChangelogPosts(): ChangelogPost[] {
	if (!cache) {
		cache = Object.entries(modules)
			.map(([path, raw]) => parseChangelogFile(slugOf(path), raw))
			.filter((p): p is ChangelogPost => p !== null)
			.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
	}
	return cache;
}

export function getChangelogPost(slug: string): ChangelogPost | undefined {
	return getChangelogPosts().find((p) => p.slug === slug);
}

/**
 * Posts newer than `lastSeenTag` (newest first). Unknown/null tag → all posts.
 * Comparison is positional (not by date), so backfilled posts behave sanely.
 */
export function getUnseenPosts(
	posts: ChangelogPost[],
	lastSeenTag: string | null | undefined
): ChangelogPost[] {
	if (!lastSeenTag) return posts;
	const idx = posts.findIndex((p) => p.version === lastSeenTag || p.slug === lastSeenTag);
	return idx === -1 ? posts : posts.slice(0, idx);
}
