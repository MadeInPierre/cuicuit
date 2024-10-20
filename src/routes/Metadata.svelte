<script lang="ts">
	import { page } from '$app/stores';
	import { siteConfig } from './siteConfig';

	export let title: string = siteConfig.name;

	function updateTitle(dataTitle: string) {
		if (dataTitle) {
			return `${dataTitle} - ${siteConfig.name}`;
		}

		const routeEnd = $page.route.id?.split('/').pop();
		if (routeEnd) {
			let name = routeEnd.replace('(', '').replace(')', '');
			return `${name[0].toUpperCase() + name.slice(1)} - ${siteConfig.name}`;
		}

		return siteConfig.name;
	}

	$: title = updateTitle($page.data?.title);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={siteConfig.description} />
	<meta name="keywords" content={siteConfig.keywords} />
	<meta name="author" content="Pierre Laclau" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content={siteConfig.url} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={siteConfig.description} />
	<meta name="twitter:image" content="https://shadcn-svelte.com/og.png" />
	<meta name="twitter:image:alt" content={siteConfig.name} />
	<meta name="twitter:creator" content="madeinpierre" />
	<meta property="og:title" content={title} />
	<meta property="og:type" content="article" />
	<meta property="og:url" content={siteConfig.url + $page.url.pathname} />
	<meta property="og:image" content="https://shadcn-svelte.com/og.png" />
	<meta property="og:image:alt" content={siteConfig.name} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:description" content={siteConfig.description} />
	<meta property="og:site_name" content={siteConfig.name} />
	<meta property="og:locale" content="EN_US" />
	<!-- <link rel="shortcut icon" href="/favicon-16x16.png" /> -->
	<!-- <link rel="apple-touch-icon" href="/apple-touch-icon.png" /> -->
</svelte:head>
