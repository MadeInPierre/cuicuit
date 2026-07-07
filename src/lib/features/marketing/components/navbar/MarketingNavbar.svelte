<script lang="ts">
	import NavDesktop from '$lib/features/marketing/components/navbar/NavDesktop.svelte';
	import NavMobile from '$lib/features/marketing/components/navbar/NavMobile.svelte';
	import ThemeButton from '$lib/shared/components/ThemeButton.svelte';
	import Button from '$lib/shared/components/ui/button/button.svelte';
	import { siteConfig } from '$lib/shared/config/site-config';
	import { Icons } from '$lib/shared/icons';
	import { ArrowRight, Languages } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { getRepoStars } from '../../server/get-repo-stars.remote';

	type Props = {
		isLoggedIn: boolean;
	};
	const { isLoggedIn }: Props = $props();

	let repoStars: number | undefined = $state(undefined);

	onMount(async () => {
		repoStars = (await getRepoStars()) || undefined;
	});
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

		<nav class="flex items-center gap-1">
			<ThemeButton />

			<Button size="icon-sm" variant="ghost"><Languages class="size-4" /></Button>
		</nav>

		{#if repoStars}
			<div in:fade>
				<Button
					size="sm"
					variant="secondary"
					href={siteConfig.links.github}
					target="_blank"
					rel="noopener noreferrer"
					class="gap-1 shadow-none"
				>
					<Icons.gitHub class="size-4 mr-1.5" />
					<span class="sr-only">GitHub</span>

					<!-- <div class="grid -space-y-0.5">
						<span>View on GitHub</span>
						<span class="text-[10px] font-normal hidden group-hover:block">{repoStars} stars, add yours!</span>
						</div> -->

					{repoStars} Stars

					<!-- <ExternalLink/> -->
					<!-- <Star class="size-3" fill="#000000" /> -->
				</Button>
			</div>
		{/if}

		{#if isLoggedIn}
			<Button href="/recipes" size="sm">
				Go to your home
				<ArrowRight />
			</Button>
		{:else}
			<!-- <Button href="/login" size="sm" variant="link">Log in</Button> -->
			<Button href="/signup" size="sm">
				Get started
				<ArrowRight />
			</Button>
		{/if}
	</div>
</div>
