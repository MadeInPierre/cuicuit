<script lang="ts">
	import { getRepoStars } from '$lib/features/marketing/server/get-repo-stars.remote.js';
	import { page } from '$app/state';
	import ThemeButton from '$lib/shared/components/ThemeButton.svelte';
	import Button from '$lib/shared/components/ui/button/button.svelte';
	import GitHub from '$lib/shared/icons/github.svelte';
	import { ArrowLeft, ArrowRight, Menu } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let { children, data } = $props();

	const supportPage = $derived(page.url.pathname.startsWith('/supporter'));
	let menuOpen = $state(false);
	let menu = $state<HTMLDetailsElement>();
	let stars: number | undefined = $state(undefined);
	onMount(() => {
		getRepoStars().then((s) => {
			stars = s;
		});
	});
</script>

<svelte:head>
	<meta name="theme-color" content="#f5f0e8" />
</svelte:head>

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape' && menuOpen) {
			menuOpen = false;
			menu?.querySelector('summary')?.focus();
		}
	}}
/>

{#snippet navigationLinks()}
	{#each [{ href: '/#how', label: 'How it works' }, { href: '/#pricing', label: 'Cloud & self-host' }, { href: '/#roadmap', label: 'Roadmap' }, { href: '/#faq', label: 'FAQ' }] as link (link.href)}
		<a
			href={link.href}
			onclick={() => (menuOpen = false)}
			class="inline-flex min-h-11 items-center hover:text-foreground transition-colors motion-reduce:transition-none"
			>{link.label}</a
		>
	{/each}
{/snippet}

<div
	class="relative isolate min-h-screen bg-background text-foreground font-sans antialiased [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-ring [&_summary:focus-visible]:outline-2 [&_summary:focus-visible]:outline-offset-4 [&_summary:focus-visible]:outline-ring"
	id="landing-root"
>
	<a
		href="#main-content"
		class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-background focus:px-4 focus:py-3"
	>
		Skip to content
	</a>
	<!-- Subtle linen grain over the whole page -->
	<div aria-hidden="true" class="grain pointer-events-none fixed inset-0 z-0"></div>
	<header class="sticky top-0 z-30 backdrop-blur-md bg-background/70 border-b border-border/60">
		<div class="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
			<a
				href="/"
				class="min-h-11 flex shrink-0 items-center justify-start gap-1 text-xl font-semibold tracking-tight"
			>
				<div class="flex items-center justify-center gap-2">
					<img
						src="/cuicuit_logo_transparent.png"
						alt=""
						width="32"
						height="32"
						decoding="async"
						class="h-8"
					/>
					<span>Cuicuit</span>
				</div>

				<span class="hidden min-[375px]:inline px-1 text-xl text-primary font-hand"> alpha </span>
			</a>

			{#if !supportPage}
				<nav
					aria-label="Main navigation"
					class="hidden lg:flex items-center gap-6 text-sm font-medium text-muted-foreground"
				>
					{@render navigationLinks()}
					<a
						href="https://github.com/MadeInPierre/cuicuit"
						target="_blank"
						rel="noreferrer"
						aria-label={stars ? `GitHub repository, ${stars} stars` : 'GitHub repository'}
						class="min-h-11 w-11 hover:text-foreground transition-colors inline-flex items-center gap-1"
					>
						<GitHub class="h-4 w-4" />
						{stars}
					</a>
				</nav>
			{/if}

			<div class="flex items-center justify-end gap-1 sm:gap-2">
				<ThemeButton class="hidden sm:flex size-8" />

				{#if supportPage}
					<a
						href="/"
						class="inline-flex min-h-11 items-center gap-1 text-sm font-medium hover:text-primary"
					>
						<ArrowLeft class="size-4" aria-hidden="true" /> Back to home
					</a>
				{:else if data.claims}
					<a
						href="/recipes"
						class="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-primary px-3 sm:px-4 py-2 text-sm font-semibold text-primary-foreground shadow-(--shadow-soft) hover:opacity-90 transition"
					>
						Back to the app <ArrowRight class="h-3.5 w-3.5" />
					</a>
				{:else}
					<Button href="/login" variant="link" size="sm" class="min-h-11 px-2">Log in</Button>
					<a
						href="/signup"
						class="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-primary px-3 sm:px-4 py-2 text-sm font-semibold text-primary-foreground shadow-(--shadow-soft) hover:opacity-90 transition"
					>
						<span class="inline-block sm:hidden">Start</span>
						<span class="hidden sm:inline-block">Sign up</span>

						<ArrowRight class="h-3.5 w-3.5" />
					</a>
				{/if}
				{#if !supportPage}
					<details bind:this={menu} bind:open={menuOpen} class="lg:hidden">
						<summary
							class="flex size-11 cursor-pointer list-none items-center justify-center rounded-full hover:bg-secondary [&::-webkit-details-marker]:hidden"
						>
							<Menu class="size-5" aria-hidden="true" />
							<span class="sr-only">Navigation menu</span>
						</summary>
						<nav
							aria-label="Mobile navigation"
							class="absolute inset-x-0 top-full grid gap-1 border-b border-border bg-background px-6 py-3 shadow-(--shadow-soft) text-sm font-medium"
						>
							{@render navigationLinks()}
						</nav>
					</details>
				{/if}
			</div>
		</div>
	</header>

	<main id="main-content" tabindex="-1">
		{@render children()}
	</main>
</div>

<style>
	:global(html) {
		scroll-behavior: smooth;
	}
	.grain {
		opacity: 0.07;
		mix-blend-mode: multiply;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9 0.7' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.3 0 0 0 0 0.2 0 0 0 0 0.1 0 0 0 1.4 -0.3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"),
			repeating-linear-gradient(0deg, rgb(90 60 30 / 0.3) 0 1px, transparent 1px 4px),
			repeating-linear-gradient(90deg, rgb(90 60 30 / 0.3) 0 1px, transparent 1px 4px);
	}
	:global(.dark) .grain {
		mix-blend-mode: screen;
		opacity: 0.04;
	}
	@media (prefers-reduced-motion: reduce) {
		:global(html) {
			scroll-behavior: auto;
		}
	}
</style>
