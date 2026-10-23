<script lang="ts">
	import type { ChangelogPost } from './changelog';

	interface Props {
		post: ChangelogPost;
	}

	let { post }: Props = $props();

	// Markdown images are below the fold: defer them without changing the source.
	const html = $derived(post.html.replaceAll('<img ', '<img loading="lazy" decoding="async" '));
</script>

<article class="w-full">
	{#if post.cover}
		<img
			src={post.cover}
			alt=""
			loading="lazy"
			decoding="async"
			class="mb-6 w-full rounded-xl object-cover shadow-(--shadow-soft)"
		/>
	{/if}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- trusted in-repo markdown -->
	<div class="changelog-body space-y-4 text-foreground/90">{@html html}</div>
</article>

<style>
	.changelog-body :global(h2) {
		font-size: 1.25rem;
		font-weight: 700;
		letter-spacing: -0.01em;
		padding-top: 0.75rem;
	}
	.changelog-body :global(h3) {
		font-size: 1.05rem;
		font-weight: 600;
		padding-top: 0.5rem;
	}
	.changelog-body :global(p) {
		line-height: 1.65;
	}
	.changelog-body :global(ul) {
		list-style: disc;
		padding-left: 1.5rem;
		display: grid;
		gap: 0.35rem;
		line-height: 1.6;
	}
	.changelog-body :global(img) {
		border-radius: 1rem;
		max-width: 100%;
	}
	.changelog-body :global(a) {
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.changelog-body :global(code) {
		font-size: 0.85em;
		background: var(--color-secondary);
		padding: 0.1em 0.35em;
		border-radius: 0.375rem;
	}
	.changelog-body :global(pre) {
		overflow-x: auto;
		border-radius: 1rem;
		background: var(--color-secondary);
		padding: 1rem;
	}
	.changelog-body :global(pre code) {
		background: none;
		padding: 0;
	}
</style>
