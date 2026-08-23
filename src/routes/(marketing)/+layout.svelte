<script>
	import ThemeButton from '$lib/shared/components/ThemeButton.svelte';
	import Button from '$lib/shared/components/ui/button/button.svelte';
	import { ArrowRight, Github } from 'lucide-svelte';

	let { children, data } = $props();
</script>

<svelte:head>
	<meta name="theme-color" content="#f5f0e8" />
</svelte:head>

<div class="min-h-screen bg-background text-foreground font-sans antialiased" id="landing-root">
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
				<a href="/#features" class="hover:text-foreground transition-colors">Features</a>
				<a href="/#roadmap" class="hover:text-foreground transition-colors">Roadmap</a>
				<a href="/#pricing" class="hover:text-foreground transition-colors">Pricing</a>
				<a href="/#faq" class="hover:text-foreground transition-colors">FAQ</a>
				<a href="/#story" class="hover:text-foreground transition-colors">Story</a>
				<a
					href="https://github.com/MadeInPierre/cuicuit"
					target="_blank"
					rel="noreferrer"
					class="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
				>
					<Github class="h-4 w-4" /> GitHub
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
</style>
