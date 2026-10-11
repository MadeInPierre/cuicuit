<script lang="ts">
	import ChangelogPost from '$lib/features/changelog/ChangelogPost.svelte';
	import { siteConfig } from '$lib/shared/config/site-config';
	import { ArrowLeft } from '@lucide/svelte';

	const { data } = $props();
	const post = $derived(data.post);
</script>

<svelte:head>
	<title>{post.title} — Cuicuit Changelog</title>
	<meta name="description" content={post.excerpt || post.title} />
	<link rel="canonical" href="{siteConfig.url}/changelog/{post.slug}" />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={post.title} />
	<meta property="og:description" content={post.excerpt || post.title} />
	{#if post.cover}
		<meta property="og:image" content="{siteConfig.url}{post.cover}" />
	{/if}
</svelte:head>

<section class="mx-auto max-w-3xl px-6 py-16">
	<a
		href="/changelog"
		class="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
	>
		<ArrowLeft class="h-4 w-4" /> All posts
	</a>
	<p class="mt-8 text-sm text-foreground/60">{post.date} · {post.version}</p>
	<h1 class="font-display mt-2 text-4xl font-semibold tracking-tight text-balance">
		{post.title}
	</h1>
	{#if post.excerpt}
		<p class="mt-3 text-lg text-foreground/80">{post.excerpt}</p>
	{/if}
	<div class="mt-8">
		<ChangelogPost {post} />
	</div>
</section>
