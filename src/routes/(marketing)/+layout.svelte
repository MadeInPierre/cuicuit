<script lang="ts">
	import { getRepoStars } from '$lib/features/marketing/server/get-repo-stars.remote.js';
	import ThemeButton from '$lib/shared/components/ThemeButton.svelte';
	import Button from '$lib/shared/components/ui/button/button.svelte';
	import GitHub from '$lib/shared/icons/github.svelte';
	import { ArrowRight } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let { children, data } = $props();

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

<div
	class="relative isolate min-h-screen bg-background text-foreground font-sans antialiased"
	id="landing-root"
>
	<!-- Subtle linen grain over the whole page -->
	<div aria-hidden="true" class="grain pointer-events-none fixed inset-0 z-0"></div>
	<!-- Food-doodle wallpaper, tiled -->
	<!-- <div
		aria-hidden="true"
		class="motif pointer-events-none absolute inset-0 -z-10 text-primary/[0.07]"
	></div> -->
	<header class="sticky top-0 z-30 backdrop-blur-md bg-background/70 border-b border-border/60">
		<div class="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
			<a
				href="/"
				class="w-70 flex items-center justify-start gap-1 text-xl font-semibold tracking-tight"
			>
				<div class="flex items-center justify-center gap-2">
					<img src="/cuicuit_logo_transparent.png" alt="Cuicuit" class="h-8" />
					<h1>Cuicuit</h1>
				</div>

				<span class="px-2 text-xl text-[#fab030] font-hand"> alpha </span>
			</a>

			<nav class="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
				<a href="/#how" class="hover:text-foreground transition-colors">How it works</a>
				<a href="/#pricing" class="hover:text-foreground transition-colors">Pricing</a>
				<a href="/#roadmap" class="hover:text-foreground transition-colors">Roadmap</a>
				<a href="/#faq" class="hover:text-foreground transition-colors">FAQ</a>
				<!-- <a href="/#story" class="hover:text-foreground transition-colors">Story</a> -->

				<a
					href="https://github.com/MadeInPierre/cuicuit"
					target="_blank"
					rel="noreferrer"
					class="hover:text-foreground transition-colors inline-flex items-center gap-1"
				>
					<GitHub class="h-4 w-4" />
					{stars}
				</a>
			</nav>

			<div class="w-70 flex items-center justify-end gap-2">
				<ThemeButton class="hidden sm:flex" />

				{#if data.claims}
					<a
						href="/recipes"
						class="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-(--shadow-soft) hover:opacity-90 transition"
					>
						Back to the app <ArrowRight class="h-3.5 w-3.5" />
					</a>
				{:else}
					<Button href="/login" variant="link" size="sm">Log in</Button>
					<a
						href="/signup"
						class="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-(--shadow-soft) hover:opacity-90 transition"
					>
						<span class="inline-block sm:hidden">Start</span>
						<span class="hidden sm:inline-block">Sign up</span>

						<ArrowRight class="h-3.5 w-3.5" />
					</a>
				{/if}
			</div>
		</div>
	</header>

	{@render children()}
</div>

<style>
	:global(html) {
		scroll-behavior: smooth;
	}
	.motif {
		background-color: currentColor;
		mask-image: url('/food-pattern.svg');
		mask-size: 630px 540px;
	}
	.grain {
		opacity: 0.07;
		mix-blend-mode: multiply;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9 0.7' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.3 0 0 0 0 0.2 0 0 0 0 0.1 0 0 0 1.4 -0.3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"),
			repeating-linear-gradient(0deg, rgb(90 60 30 / 0.5) 0 1px, transparent 1px 4px),
			repeating-linear-gradient(90deg, rgb(90 60 30 / 0.5) 0 1px, transparent 1px 4px);
	}
	:global(.dark) .grain {
		mix-blend-mode: screen;
		opacity: 0.04;
	}
</style>
