<script lang="ts">
	import { CookingPot } from 'lucide-svelte';
	import NavDesktopLink from './NavDesktopLink.svelte';
	import { navLinksMarketing } from '$lib/features/marketing/consts/nav-links';
	import { siteConfig } from '$lib/shared/config/site-config';
</script>

<div class="mr-4 hidden md:flex">
	<a href="/" class="mr-6 flex items-center gap-2">
		<img src="/cuicuit_logo_transparent.png" alt={siteConfig.name} class="h-8" />
		<span class="hidden text-lg font-bold sm:inline-block"> {siteConfig.name} </span>
	</a>

	<nav class="flex items-center gap-6 text-sm">
		{#each navLinksMarketing as { href, title, startsWith, startPath, className }}
			<NavDesktopLink {href} {startsWith} startPath={startPath || ''} class={className}>
				{title}
			</NavDesktopLink>
		{/each}
	</nav>
</div>
