<script lang="ts">
	import NavDesktop from '$lib/features/marketing/components/navbar/NavDesktop.svelte';
	import NavMobile from '$lib/features/marketing/components/navbar/NavMobile.svelte';
	import Button from '$lib/shared/components/ui/button/button.svelte';
	import { siteConfig } from '$lib/shared/config/site-config';
	import { Icons } from '$lib/shared/icons';
	import { ArrowRight } from '@lucide/svelte';

	type Props = {
		isLoggedIn: boolean;
	};
	const { isLoggedIn }: Props = $props();
</script>

<div class="container flex max-w-(--breakpoint-2xl) items-center px-6">
	<!-- Left side (logo and links) -->
	<NavDesktop />
	<NavMobile />

	<!-- Right side (icons and login/signup buttons) -->
	<div class="flex flex-1 items-center justify-between space-x-4 md:justify-end">
		<div class="w-full flex-1 md:w-auto md:flex-none">
			<!-- <CommandMenu /> -->
		</div>

		<nav class="flex items-center">
			<a href={siteConfig.links.github} target="_blank" rel="noopener noreferrer">
				<Button class="w-9 px-0" size="sm" variant="ghost">
					<Icons.gitHub class="h-4 w-4" />
					<span class="sr-only">GitHub</span>
				</Button>
			</a>
		</nav>

		{#if isLoggedIn}
			<Button href="/recipes" size="sm">
				Go to your home
				<ArrowRight />
			</Button>
		{:else}
			<Button href="/login" size="sm" variant="link">Log in</Button>
			<Button href="/signup" size="sm">Get started</Button>
		{/if}
	</div>
</div>
