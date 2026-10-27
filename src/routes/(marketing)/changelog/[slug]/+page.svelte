<script lang="ts">
	import ChangelogPost from '$lib/features/changelog/ChangelogPost.svelte';
	import JsonLd from '$lib/shared/components/JsonLd.svelte';
	import { siteConfig } from '$lib/shared/config/site-config';
	import { ArrowLeft } from '@lucide/svelte';

	const { data } = $props();
	const post = $derived(data.post);
	const postUrl = $derived(`${siteConfig.url}/changelog/${post.slug}`);

	const structuredData = $derived([
		{
			'@context': 'https://schema.org',
			'@type': 'BlogPosting',
			headline: post.title,
			description: post.excerpt || post.title,
			url: postUrl,
			mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
			datePublished: post.date,
			dateModified: post.date,
			image: post.cover ? `${siteConfig.url}${post.cover}` : siteConfig.ogImage,
			author: {
				'@type': 'Person',
				name: 'Pierre Laclau',
				url: 'https://github.com/MadeInPierre'
			},
			publisher: {
				'@type': 'Organization',
				name: 'Cuicuit',
				url: siteConfig.url,
				logo: {
					'@type': 'ImageObject',
					url: `${siteConfig.url}/cuicuit_logo_transparent.png`
				}
			}
		},
		{
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url },
				{
					'@type': 'ListItem',
					position: 2,
					name: 'Changelog',
					item: `${siteConfig.url}/changelog`
				},
				{ '@type': 'ListItem', position: 3, name: post.title, item: postUrl }
			]
		}
	]);
</script>

<JsonLd data={structuredData} />

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
	<div class="mt-8 rounded-xl bg-card p-6 drop-shadow-xs sm:p-8">
		<ChangelogPost {post} />
	</div>
</section>
