<script lang="ts">
	import { goto } from '$app/navigation';
	import ThemeButton from '$lib/shared/components/ThemeButton.svelte';
	import { siteConfig } from '$lib/shared/config/site-config';
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';
	import Stitch from './Stitch.svelte';
	import Wave from './Wave.svelte';
	import GitHub from '$lib/shared/icons/github.svelte';
	import {
		ArrowRight,
		Camera,
		Check,
		Cloud,
		Globe,
		Heart,
		Plus,
		Server,
		Sprout,
		Type
	} from '@lucide/svelte';
	import GlassScreenshots from './GlassScreenshots.svelte';
	import SupportWallAutoDialog from './supporter/success/SupportWallAutoDialog.svelte';
	import SeparatorZigZag from '../(app)/shopping-list/SeparatorZigZag.svelte';

	const { data } = $props();

	const githubUrl = 'https://github.com/MadeInPierre/cuicuit';

	const loop = [
		{
			title: 'Throw in meals, whenever',
			text: 'No calendar to fill. Add a recipe or a missing item the moment you think of it.',
			img: '/hero/mockups/iphone_plan.webp',
			alt: 'Cuicuit plan screen listing meals without dates'
		},
		{
			title: 'One list, sorted by aisle',
			text: 'Meals and extras merge into a single shopping list, grouped the way you walk the store, each item linked to its meal.',
			img: '/hero/mockups/iphone_list.webp',
			alt: 'Cuicuit shopping list grouped by supermarket aisle'
		},
		{
			title: 'Know what you can cook now',
			text: 'Every meal shows whether you have what it needs. Badges update as you tick things off.',
			img: '/hero/mockups/iphone_recipes.webp',
			alt: 'Cuicuit recipe list with cookable badges'
		}
	];

	const imports = [
		{ icon: Globe, label: 'Any recipe website' },
		{ icon: Camera, label: 'Photos of cookbooks' },
		{ icon: Type, label: 'Pasted text' }
	];

	const roadmap = [
		{
			label: 'Live today',
			tone: 'live',
			items: [
				'Recipe import',
				'Dateless meal plan',
				'Aisle-aware shopping list',
				'Cookability badges'
			]
		},
		{
			label: 'Coming soon',
			tone: 'soon',
			items: ['Self-hosting with Docker', 'Pantry tracking', 'Social media import']
		},
		{ label: 'Later', tone: 'later', items: ['Online delivery', 'Nutrition & habits'] }
	];

	const faqs = [
		{
			q: 'How is this different from other recipe managers?',
			a: "Most make you plan by date. Cuicuit doesn't: you drop meals and missing items in whenever, and it keeps one merged, aisle-sorted list and tells you which meals you can already cook. The goal is the least possible time between “what's for dinner” and “I'm done shopping”."
		},
		{
			q: 'Is Cuicuit really free?',
			a: 'Yes. The hosted app is free with fair usage limits, funded by supporters. Only a few costly features (like AI imports) use community “seeds” to share the cost.'
		},
		{
			q: 'How does recipe import work?',
			a: 'Paste a recipe URL, a photo or some text. Cuicuit extracts ingredients, quantities, steps and timings, using open standards like schema.org/Recipe plus AI when needed.'
		},
		{
			q: 'Is it stable?',
			a: "It's in alpha: it works and I use it daily, but expect rough edges. Feedback on Discord directly shapes what gets built next."
		},
		{
			q: 'Where does the name come from?',
			a: "“Cui-cui” is a French bird chirp and “cuit” means cooked, so “c'est cuit” becomes “c'est cuicuit”. Say it “qui-qui”."
		}
		// {
		// 	q: 'Can I self-host it?',
		// 	a: 'Not yet. A docker-compose setup is planned once the cloud version is stable. Star the repo to follow along.'
		// }
	];

	let openSupportDialog = $state(false);
	let media = useMedia();
	function openSupportWall() {
		if (media.md) openSupportDialog = true;
		else goto('/supporter');
	}
</script>

<svelte:head>
	<title>Cuicuit — Throw in meals, get a shopping list that sorts itself</title>
	<meta
		name="description"
		content="Add meal ideas and missing items anytime, no calendar needed. Cuicuit merges them into one aisle-sorted shopping list and shows which meals you can cook now. Open source, free to start."
	/>
	<meta property="og:title" content="Cuicuit — Your shopping list organizes itself" />
	<meta
		property="og:description"
		content="Throw in meal ideas anytime. Get one aisle-sorted shopping list and live cookability badges. Open source."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://cuicuit.laclau.dev" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Cuicuit — Your shopping list organizes itself" />
	<meta
		name="twitter:description"
		content="Throw in meal ideas anytime. Get one aisle-sorted shopping list and live cookability badges. Open source."
	/>
	<link rel="canonical" href="https://cuicuit.laclau.dev" />
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "SoftwareApplication",
			"name": "Cuicuit",
			"applicationCategory": "FoodApplication",
			"operatingSystem": "Web",
			"description": "Meal planning app: throw in meals anytime and get an aisle-sorted shopping list.",
			"url": "https://cuicuit.laclau.dev",
			"offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR" },
			"softwareVersion": "Alpha",
			"openSource": true
		}
	</script>
</svelte:head>

<!-- ==================== HERO ==================== -->
<section id="top" class="relative bg-(--gradient-warm)">
	<div
		aria-hidden="true"
		class="pointer-events-none absolute inset-0 bg-primary/9 mask-[url('/food-pattern.svg')] mask-size-[500px_300px]"
	></div>
	<div class="relative mx-auto max-w-6xl px-6 pt-16 pb-20 md:pt-24">
		<div class="mx-auto max-w-3xl text-center">
			<h1
				class="font-display text-5xl md:text-6xl font-semibold tracking-tight text-balance text-foreground"
			>
				Throw in meal ideas anytime. <span class="text-primary">Your list sorts itself.</span>
			</h1>
			<p class="mx-auto mt-6 max-w-2xl text-lg text-foreground/80 text-pretty">
				<!-- Variant: Skip the weekly planning ritual. Add meals and missing items when you think of them, and Cuicuit builds one aisle-sorted list and tells you what you can cook right now. -->
				Add meals and missing items when you think of them. Cuicuit merges everything into one aisle-sorted
				shopping list and shows which meals you can already cook.
			</p>
			<div class="mt-8 flex flex-col sm:flex-row justify-center gap-3">
				<a
					href="/signup"
					class="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground shadow-(--shadow-soft) transition hover:-translate-y-0.5 motion-reduce:transition-none"
				>
					Sign up free <ArrowRight class="h-4 w-4" />
				</a>
				<a
					href={githubUrl}
					target="_blank"
					rel="noreferrer"
					class="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-foreground/30 bg-background px-7 text-base font-semibold text-foreground transition hover:-translate-y-0.5 motion-reduce:transition-none"
				>
					<GitHub class="h-4 w-4" /> Star on GitHub
				</a>
			</div>
			<p class="mt-4 text-sm text-foreground/70">Free to use · Open source · Alpha</p>
		</div>

		<div class="mt-14">
			<GlassScreenshots
				desktopSrc="/screenshots/demo_desktop.webp"
				desktopAlt="Cuicuit desktop app: planned meals with cookable badges on the left, recipe library on the right"
				mobileSrc="/hero/mockups/iphone_plan.webp"
				mobileAlt="Cuicuit on a phone: planned meals with cookable badges"
				videoUrl="https://github.com/user-attachments/assets/8f880754-87fd-4342-91ce-7fc59808c708"
			/>
		</div>
	</div>
</section>

<!-- ==================== THE LOOP ==================== -->
<section id="how" class="mx-auto max-w-6xl px-6 py-20">
	<h2 class="font-display text-3xl md:text-4xl font-semibold tracking-tight text-balance max-w-2xl">
		From “what's for dinner” to done shopping, as quick as possible.
	</h2>
	<div class="mt-12 grid gap-10 md:grid-cols-3">
		{#each loop as step (step.title)}
			<div>
				<div class="rounded-3xl bg-secondary/60 px-8 pt-8 overflow-hidden h-96">
					<img
						src={step.img}
						alt={step.alt}
						width="700"
						height="1389"
						loading="lazy"
						decoding="async"
						class="mx-auto w-56 h-auto rounded-3xl shadow-(--shadow-lift) mix-blend-normal
							mask-[linear-gradient(to_bottom,white_90%,transparent_100%)]"
					/>
				</div>
				<h3 class="mt-5 font-display text-xl font-semibold">{step.title}</h3>
				<p class="mt-2 text-foreground/80 max-w-prose">{step.text}</p>
			</div>
		{/each}
	</div>
</section>

<!-- ==================== IMPORT ==================== -->
<div class="text-secondary/40"><Wave /></div>
<section id="import" class="bg-secondary/40">
	<div class="mx-auto max-w-6xl px-6 py-16 flex flex-col md:flex-row md:items-center gap-8">
		<div class="md:w-1/2">
			<h2 class="font-display text-3xl font-semibold tracking-tight text-balance">
				Bring your recipes with you.
			</h2>
			<p class="mt-3 text-foreground/80 max-w-prose">
				Import from a link, a photo or pasted text. Social media import is on the way.
			</p>
		</div>
		<ul class="md:w-1/2 grid gap-3 sm:grid-cols-3">
			{#each imports as item (item.label)}
				<li class="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-(--shadow-soft)">
					<item.icon class="h-5 w-5 shrink-0 text-primary" />
					<span class="text-sm font-medium">{item.label}</span>
				</li>
			{/each}
		</ul>
	</div>
</section>
<div class="text-secondary/40"><Wave flip /></div>

<!-- ==================== FAQ ==================== -->
<section id="faq" class="mx-auto max-w-3xl px-6 py-20">
	<h2 class="font-display text-3xl md:text-4xl font-semibold tracking-tight">Good questions</h2>
	<div class="mt-8 divide-y divide-border border-y border-border">
		{#each faqs as faq (faq.q)}
			<details class="group py-5">
				<summary
					class="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-medium"
				>
					{faq.q}
					<Plus
						class="h-5 w-5 shrink-0 text-primary transition-transform group-open:rotate-45 motion-reduce:transition-none"
					/>
				</summary>
				<p class="mt-3 text-foreground/80 max-w-prose">{faq.a}</p>
			</details>
		{/each}
	</div>
</section>

<Stitch />

<!-- ==================== PRICING / OPEN ==================== -->
<section id="pricing" class="mx-auto max-w-6xl px-6 pb-24">
	<h2 class="font-display text-3xl md:text-4xl font-semibold tracking-tight text-balance max-w-2xl">
		Free to use. Yours to host. Kept alive by supporters.
	</h2>
	<div class="mt-10 grid gap-6 lg:grid-cols-[1fr_1.15fr_1fr]">
		<!-- Hosted -->
		<div class="flex flex-col rounded-3xl border border-border bg-card p-8">
			<div class="flex items-center justify-between">
				<Cloud class="h-6 w-6 text-primary" />
				<span class="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
					Available now
				</span>
			</div>
			<h3 class="mt-6 font-display text-2xl font-semibold">Hosted</h3>
			<p class="mt-1 font-display text-4xl font-semibold">Free</p>
			<ul class="mt-6 mb-auto space-y-2 text-foreground/80">
				{#each ['Every feature, nothing to install', 'Fair usage limits', 'Community seeds for AI imports'] as t (t)}
					<li class="flex gap-2"><Check class="mt-1 h-4 w-4 shrink-0 text-primary" />{t}</li>
				{/each}
			</ul>
			<a
				href="/signup"
				class="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground transition hover:-translate-y-0.5 motion-reduce:transition-none"
			>
				Sign up free <ArrowRight class="h-4 w-4" />
			</a>
		</div>

		<!-- Self-hosted: prominent, with a coming-soon tag -->
		<div
			class="relative flex flex-col rounded-3xl bg-foreground p-8 text-background shadow-(--shadow-lift)"
		>
			<div class="flex items-center justify-between">
				<Server class="h-6 w-6 text-primary-foreground" />
				<span
					class="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
				>
					Coming soon
				</span>
			</div>
			<h3 class="mt-6 font-display text-2xl font-semibold">Self-hosted</h3>
			<p class="mt-1 font-display text-4xl font-semibold">Free, forever</p>
			<p class="mt-4 text-background/80">
				Your recipes on your own hardware, with your own API keys. One docker-compose file, landing
				right after the cloud version stabilizes.
			</p>
			<pre
				class="mt-6 overflow-x-auto rounded-xl bg-background/10 p-4 text-sm text-background"><code
					>$ git clone cuicuit
$ docker compose up -d</code
				></pre>
			<a
				href={githubUrl}
				target="_blank"
				rel="noreferrer"
				class="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-background px-6 font-semibold text-foreground transition hover:-translate-y-0.5 motion-reduce:transition-none"
			>
				<GitHub class="h-4 w-4" /> Star to follow along
			</a>
		</div>

		<!-- Support -->
		<div class="flex flex-col rounded-3xl bg-primary/10 p-8">
			<div class="flex items-center justify-between">
				<Sprout class="h-6 w-6 text-primary" />
				<span class="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-foreground"
					>Keeps it free</span
				>
			</div>
			<h3 class="mt-6 font-display text-2xl font-semibold">Support</h3>
			<p class="mt-1 font-display text-4xl font-semibold">
				5 € <span class="text-xl text-foreground/70">= 100 seeds</span>
			</p>
			<p class="mt-4 text-foreground/80">
				Cuicuit is built by one person and funded by supporters. Seeds pay for costly features like
				AI imports: some are yours, the rest are shared with every user.
			</p>
			<button
				type="button"
				onclick={openSupportWall}
				class="mt-8 lg:mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-foreground/30 bg-background px-6 font-semibold transition hover:-translate-y-0.5 motion-reduce:transition-none"
			>
				<Heart class="h-4 w-4 text-primary" /> Support Cuicuit
			</button>
		</div>
	</div>
</section>

<!-- <Stitch /> -->

<!-- ==================== ROADMAP ==================== -->
<section id="roadmap" class="mx-auto max-w-6xl px-6 pb-24">
	<div class="flex flex-wrap items-baseline gap-x-4">
		<h2 class="font-display text-3xl md:text-4xl font-semibold tracking-tight">Where we are</h2>
		<span class="font-hand text-3xl text-primary -rotate-2">alpha, growing fast</span>
	</div>
	<p class="mt-2 text-foreground/80 max-w-prose">
		The core loop works and I use it daily. Here is what comes next, with no promised dates.
	</p>
	<div class="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
		{#each roadmap as col, i (col.label)}
			<div class="relative pl-12 md:pl-0">
				{#if i < roadmap.length - 1}
					<span
						aria-hidden="true"
						class="absolute left-4 top-8 -bottom-10 border-l-2 border-dashed md:hidden {col.tone ===
						'live'
							? 'border-primary'
							: 'border-foreground/30'}"
					></span>
				{/if}
				<div
					class="absolute left-0 top-0 z-10 flex items-center gap-3 md:static md:z-auto"
					aria-hidden="true"
				>
					{#if col.tone === 'live'}
						<span
							class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
						>
							<Check class="h-4 w-4" />
						</span>
					{:else if col.tone === 'soon'}
						<span
							class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background"
						>
							<span class="h-2.5 w-2.5 rounded-full bg-primary"></span>
						</span>
					{:else}
						<span
							class="h-8 w-8 shrink-0 rounded-full border-2 border-dashed border-foreground/40 bg-background"
						></span>
					{/if}
					<span
						class="hidden md:block h-0 flex-1 border-t-2 border-dashed {col.tone === 'live'
							? 'border-primary'
							: 'border-foreground/30'}"
					></span>
				</div>
				<div
					class="relative md:mt-6 rounded-2xl p-2 shadow-(--shadow-lift) {i === 1
						? 'md:rotate-1'
						: i === 2
							? 'md:-rotate-1'
							: 'md:-rotate-[0.5deg]'} {col.tone === 'live'
						? 'bg-card'
						: col.tone === 'soon'
							? 'bg-[oklch(0.92_0.05_45)] dark:bg-[#4a3a33]'
							: 'bg-[#dcc7a3] dark:bg-[#4a4034]'}"
				>
					<span
						aria-hidden="true"
						class="absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2 -rotate-2 bg-[oklch(0.86_0.13_75/0.75)] shadow-(--shadow-soft) [clip-path:polygon(4%_0,100%_0,96%_100%,0_100%)]"
					></span>
					<div
						class="h-full rounded-xl border-2 border-dashed px-5 pb-6 pt-8 {col.tone === 'live'
							? 'border-primary/50'
							: 'border-foreground/25'}"
					>
						<h3 class="font-display text-xl font-semibold">{col.label}</h3>
						<ul class="mt-4 space-y-2.5 text-foreground/85">
							{#each col.items as item (item)}
								<li class="flex items-start gap-2">
									<span
										class="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full {col.tone === 'later'
											? 'bg-foreground/50'
											: 'bg-primary'}"
									></span>
									{item}
								</li>
							{/each}
						</ul>
					</div>
				</div>
			</div>
		{/each}
	</div>
</section>

<!-- ==================== FINAL CTA ==================== -->
<section class="mx-auto max-w-6xl px-6 pt-8">
	<div
		class="relative overflow-hidden rounded-4xl bg-primary p-4 text-center shadow-(--shadow-lift) rotate-[-0.4deg]"
	>
		<div
			aria-hidden="true"
			class="pointer-events-none absolute inset-0 bg-primary-foreground/15 mask-[url('/food-pattern.svg')] mask-size-[630px_540px]"
		></div>
		<!-- Embroidered patch: stitched inner border -->
		<div
			class="relative rounded-3xl border-2 border-dashed border-primary-foreground/50 px-6 py-12 md:px-16 md:py-16"
		>
			<img
				src="/cuicuit_waving.png"
				alt=""
				aria-hidden={true}
				width="96"
				height="96"
				loading="lazy"
				class="mx-auto h-24 w-24 -rotate-6 mb-2 drop-shadow-md"
			/>
			<span class="block font-hand text-3xl text-primary-foreground/90 rotate-1">psst, hungry?</span
			>
			<h2
				class="mt-2 font-display text-4xl md:text-6xl font-semibold tracking-tight text-primary-foreground text-balance"
			>
				Try it on tonight's
				<span class="relative inline-block">
					dinner.
					<svg
						aria-hidden="true"
						viewBox="0 0 200 14"
						preserveAspectRatio="none"
						class="absolute -bottom-2 left-0 h-3 w-full text-yolk"
						fill="none"
						stroke="currentColor"
						stroke-width="4"
						stroke-linecap="round"
					>
						<path d="M3 9C40 2 70 12 105 6S170 3 197 8" />
					</svg>
				</span>
			</h2>
			<p class="mx-auto mt-5 max-w-xl text-lg text-primary-foreground">
				Import one recipe, add a few extras, and see your list sort itself.
			</p>
			<div class="mt-8 flex flex-col sm:flex-row justify-center gap-3">
				<a
					href="/signup"
					class="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-background px-8 text-lg font-semibold text-foreground shadow-(--shadow-soft) transition hover:-translate-y-0.5 hover:rotate-1 motion-reduce:transition-none"
				>
					Sign up free <ArrowRight class="h-5 w-5" />
				</a>
				<a
					href={githubUrl}
					target="_blank"
					rel="noreferrer"
					class="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border-2 border-primary-foreground/70 px-8 text-lg font-semibold text-primary-foreground transition hover:bg-primary-foreground/10 motion-reduce:transition-none"
				>
					<GitHub class="h-5 w-5" /> Star on GitHub
				</a>
			</div>
			<p class="mt-8 font-hand text-2xl text-primary-foreground rotate-1">
				Self-hosting: coming soon. Star the repo to follow along. C'est cuicuit!
			</p>
		</div>
	</div>
</section>

<!-- ==================== FOOTER ==================== -->
<footer class="mx-auto max-w-6xl px-6 mt-24 pb-12">
	<SeparatorZigZag />

	<div class="grid gap-8 pt-10 md:grid-cols-[1.5fr_1fr]">
		<div>
			<div class="flex items-center gap-2 font-display text-lg font-semibold">
				<img src="/cuicuit_logo_transparent.png" alt="" width="24" height="24" class="h-6 w-6" />
				Cuicuit
			</div>
			<p class="mt-3 text-sm text-foreground/80 max-w-prose">
				Hi! I'm Pierre 😊 I made Cuicuit for myself and hope it'll be useful for more people. I'm
				building in the open, keeping it free thanks to supporters. A 5 € support gives you 100
				seeds for costly features like imports, and you give 50 seeds to everyone.
			</p>
			<button
				type="button"
				onclick={openSupportWall}
				class="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-foreground/30 px-5 text-sm font-semibold hover:bg-secondary"
			>
				<Heart class="h-4 w-4 text-primary" /> Support Cuicuit
			</button>
		</div>
		<div class="flex flex-col gap-1 text-sm text-foreground/80 md:items-end md:justify-center">
			<a
				href={githubUrl}
				target="_blank"
				rel="noreferrer"
				class="inline-flex min-h-8 items-center gap-2 hover:text-foreground"
			>
				<GitHub class="h-4 w-4" /> GitHub
			</a>
			<a
				href={siteConfig.links.discord}
				target="_blank"
				rel="noreferrer"
				class="inline-flex min-h-8 items-center gap-2 hover:text-foreground"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					fill="currentColor"
					viewBox="0 0 16 16"
					aria-hidden="true"
				>
					<path
						d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"
					/>
				</svg>
				Discord
			</a>
			<ThemeButton class="inline-flex justify-center md:justify-end" />
		</div>
	</div>
</footer>

<SupportWallAutoDialog email={data.claims?.email || null} bind:open={openSupportDialog} />

<style>
	:global(html) {
		scroll-behavior: smooth;
	}
	@media (prefers-reduced-motion: reduce) {
		:global(html) {
			scroll-behavior: auto;
		}
	}
</style>
