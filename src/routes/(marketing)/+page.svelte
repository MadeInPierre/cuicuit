<script lang="ts">
	import { WEEKLY_COMMUNITY_SEEDS_LIMIT } from '$lib/core/operations/credits';
	import SourceLogoStack from '$lib/features/recipes/components/SourceLogoStack.svelte';
	import ThemeButton from '$lib/shared/components/ThemeButton.svelte';
	import { siteConfig } from '$lib/shared/config/site-config';
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';
	import Discord from '$lib/shared/icons/discord.svelte';
	import GitHub from '$lib/shared/icons/github.svelte';
	import {
		ArrowRight,
		Check,
		ChevronRight,
		Cloud,
		ExternalLink,
		Globe,
		Heart,
		Megaphone,
		Plus,
		Server,
		Sprout,
		Type
	} from '@lucide/svelte';
	import SeparatorZigZag from '../(app)/shopping-list/SeparatorZigZag.svelte';
	import GlassScreenshots from './GlassScreenshots.svelte';
	import Stitch from './Stitch.svelte';
	import SeedSteps from './supporter/SeedSteps.svelte';
	import SupportWallAutoDialog from './supporter/success/SupportWallAutoDialog.svelte';
	import Wave from './Wave.svelte';

	const { data } = $props();

	const githubUrl = 'https://github.com/MadeInPierre/cuicuit';
	const releasesUrl = `${githubUrl}/releases`;

	const loop = [
		{
			title: 'Throw in meals, whenever',
			text: 'No calendar to fill. Add a recipe or a missing item the moment you think of it.',
			img: '/hero/mockups/iphone_plan.webp',
			alt: 'Cuicuit plan screen listing meals without dates'
		},
		{
			title: 'One list, sorted by aisle',
			text: 'Meals and extras merge into a single  neat shopping list, each item linked to its meal.',
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
		{ icon: Globe, label: 'Any website or blog' },
		{ icon: Type, label: 'Any text' }
	];

	const roadmap = [
		{
			label: 'Live today',
			tone: 'live',
			items: [
				'Recipe import',
				'Dateless meal plan',
				'Combined shopping list',
				'Cookability badges'
			]
		},
		{
			label: 'Coming soon',
			tone: 'soon',
			items: ['Self-hosting with Docker', 'Nutrition stats & Timeline', 'Offline support']
		},
		{
			label: 'Later',
			tone: 'later',
			items: ['Online groceries? Expirations?']
		}
	];

	const faqs = [
		{
			q: 'How is this different from other recipe managers?',
			a: "Most make you plan by date, and you must manage ingredients separately. Cuicuit doesn't: you drop in meals and missing items whenever with a single search bar, and it keeps one merged, aisle-sorted list and tells you which meals you can already cook. The goal is the least possible time between “what's for dinner” and “I'm done shopping”."
		},
		{
			q: 'Is Cuicuit really free?',
			a: `Yes! All features free, with no subscription required. To share hosting costs, recipe imports use seeds. You can use up to ${WEEKLY_COMMUNITY_SEEDS_LIMIT} shared seeds weekly while the community fund has seeds available. If it runs out, you can wait for supporters to top-up or contribute yourself to get your own seeds. Your saved recipes, plan and shopping list remain always available.`
		},
		{
			q: 'How does recipe import work?',
			a: 'Paste a recipe link (YouTube, TikTok, Instagram, X, Facebook or any blog) or some text. Cuicuit extracts ingredients, quantities, steps and timings, using open standards like schema.org/Recipe plus AI when needed (low-CO2 inference locations chosen on Cloud).'
		},
		{
			q: 'Can I host it myself?',
			a: 'Soon. Cuicuit is open source (AGPL-3.0), and a Docker Compose release is planned once the cloud version stabilizes. Early 2027 is a target, not a confirmed release date. Watch releases on GitHub for updates.'
		},
		{
			q: 'Is it stable?',
			a: "It's in alpha: it works and I use it daily, but expect rough edges. Feedback on Discord directly shapes what gets built next."
		},
		{
			q: 'Where does the name come from?',
			a: "“Cui-cui” is the sound of a bird chirp in French and “cuit” means cooked, so “c'est cuit” becomes “c'est cuicuit”. Say it “qui-qui”."
		}
	];

	let openSupportDialog = $state(false);
	let media = useMedia();
	function openSupportWall(event: MouseEvent) {
		if (media.md && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
			event.preventDefault();
			openSupportDialog = true;
		}
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
				class="font-display text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-balance text-foreground"
			>
				<span class="block"> Throw in meal ideas anytime. </span>
				<span class="text-primary"> Your list sorts itself. </span>
			</h1>
			<p
				class="mx-auto mt-6 max-w-lg md:max-w-3xl text-base sm:text-lg text-foreground/80 text-pretty"
			>
				Add meals and missing items whenever you think of them. Cuicuit merges them into one
				aisle-sorted shopping list and shows which meals you can already cook.
			</p>
			<div class="mt-8 flex flex-col sm:flex-row sm:items-start justify-center gap-3">
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
					class="inline-flex min-h-12 items-center justify-center gap-2 px-4 text-base font-medium text-foreground underline underline-offset-4 hover:text-primary"
				>
					<GitHub class="h-4 w-4" /> Star on GitHub
				</a>
			</div>
			<p class="mt-4 text-sm text-foreground/75">
				Free in the cloud · Self-hosting soon · Open source
			</p>
		</div>

		<div class="mt-14">
			<GlassScreenshots
				desktopSrc="/screenshots/demo_desktop.webp"
				desktopAlt="Cuicuit desktop app: planned meals with cookable badges on the left, recipe library on the right"
				mobileSrc="/hero/mockups/iphone_plan.webp"
				mobileAlt="Cuicuit on a phone: planned meals with cookable badges"
				videoUrl="https://github.com/user-attachments/assets/9fc9e146-efce-4926-8db1-326a2c05e185"
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
						class="mx-auto w-56 h-auto rounded-3xl drop-shadow-xl
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
				Curate your own recipe library.
			</h2>
			<p class="mt-3 text-foreground/80 max-w-md">
				Import from anywhere: paste a recipe link or text. Cuicuit guesses useful filters and
				displays them in a gallery.
			</p>
		</div>
		<div class="md:w-1/2 space-y-3">
			<div class="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-(--shadow-soft)">
				<SourceLogoStack badgeClass="size-8" logoClass="size-4" withBlogsPill={false} />
				<div class="min-w-0">
					<p class="flex flex-wrap items-center gap-2 text-sm font-semibold">
						Social videos & posts
					</p>
					<p class="mt-0.5 text-xs text-foreground/75">
						YouTube · TikTok · Instagram · X · Facebook
					</p>
				</div>
			</div>
			<ul class="grid gap-3 grid-cols-2">
				{#each imports as item (item.label)}
					<li class="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-(--shadow-soft)">
						<item.icon class="h-5 w-5 shrink-0 text-primary" />
						<span class="text-sm font-medium">{item.label}</span>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</section>
<div class="text-secondary/40"><Wave flip /></div>

<!-- ==================== CLOUD / SELF-HOST ==================== -->
<section id="pricing" class="mx-auto max-w-6xl px-6 pt-20 pb-24 scroll-mt-16">
	<h2 class="font-display text-3xl md:text-4xl font-semibold tracking-tight text-balance max-w-2xl">
		Free in the cloud today. Yours to host soon.
	</h2>
	<p class="mt-3 text-foreground/80 max-w-lg">
		The same open-source app either way. Start in the cloud in a minute, or run it yourself once the
		Docker release lands.
	</p>
	<div class="mt-10 grid gap-6 md:grid-cols-2">
		<!-- Cloud: the recommended path, available now -->
		<div class="flex flex-col rounded-3xl bg-foreground p-8 text-background shadow-(--shadow-lift)">
			<div class="flex items-center justify-between">
				<Cloud class="h-6 w-6" aria-hidden="true" />
				<span
					class="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
				>
					Available now
				</span>
			</div>
			<h3 class="mt-6 font-display text-2xl font-semibold">Cloud</h3>
			<p class="mt-1 font-display text-4xl font-semibold flex gap-2 items-end">
				Free
				<span class="text-lg">crowdfunded</span>
			</p>
			<ul class="mt-6 mb-auto space-y-2 text-background/85">
				{#each ['Every feature, nothing to install', 'Synced with your friends and family', `Fair usage limits on recipe imports`] as t (t)}
					<li class="flex gap-2">
						<Check class="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />{t}
					</li>
				{/each}
			</ul>
			<p class="mt-4 text-sm text-background/85">
				Imports use 'seeds' as a way to share hosting costs. If shared seeds run out, wait for a
				supporter to top-up or contribute to get your own.
			</p>
			<a
				href="/signup"
				class="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground transition hover:-translate-y-0.5 motion-reduce:transition-none"
			>
				Sign up free <ArrowRight class="h-4 w-4" aria-hidden="true" />
			</a>
			<p class="mt-3 text-center text-sm text-background/75">No card needed.</p>
		</div>

		<!-- Self-hosting is planned, not available yet. -->
		<div
			class="flex flex-col rounded-3xl bg-card p-8 outline-2 outline-dashed -outline-offset-8 outline-foreground/25"
		>
			<div class="flex items-center justify-between">
				<Server class="h-6 w-6 text-primary" aria-hidden="true" />
				<span
					class="rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary"
				>
					Coming soon
				</span>
			</div>
			<h3 class="mt-6 font-display text-2xl font-semibold">Self-hosted</h3>
			<p class="mt-1 font-display text-4xl font-semibold">
				Free
				<span class="text-lg">forever</span>
			</p>
			<ul class="mt-6 space-y-2 text-foreground/80">
				{#each ['Same app and features on your hardware', 'Bring your own API keys', 'One Docker Compose file'] as t (t)}
					<li class="flex gap-2">
						<Check class="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />{t}
					</li>
				{/each}
			</ul>
			<p class="mt-4 mb-auto text-sm text-foreground/75">
				Coming soon around end of 2026, once Cloud stabilizes.
			</p>
			<div class="mt-8 flex flex-col gap-3 sm:flex-row">
				<a
					href={releasesUrl}
					target="_blank"
					rel="noreferrer"
					class="inline-flex min-h-11 items-center gap-2 font-medium underline underline-offset-4 hover:text-primary"
				>
					<GitHub class="h-4 w-4" /> Watch releases
				</a>
			</div>
		</div>
	</div>

	<!-- Seeds: how the cloud stays free -->
	<div class="mt-6 rounded-3xl bg-primary/10 p-8">
		<div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
			<div>
				<h3 class="font-display text-2xl font-semibold">How the cloud stays free</h3>
				<p class="mt-2 max-w-xl text-foreground/80">
					Contributions help cover hosting and recipe imports. You get your own seeds, and gift
					seeds to the community fund. Contributing is optional.
				</p>
			</div>
			<a
				href="/supporter"
				aria-haspopup={media.md ? 'dialog' : undefined}
				onclick={openSupportWall}
				class="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-foreground/30 bg-background px-6 font-semibold transition hover:-translate-y-0.5 motion-reduce:transition-none"
			>
				<Sprout class="h-4 w-4 text-primary" aria-hidden="true" /> Support Cuicuit
			</a>
		</div>
		<details class="group mt-4">
			<summary class="inline-flex min-h-11 cursor-pointer items-center gap-1 font-medium">
				What are seeds?
				<ChevronRight
					class="size-4 translate-y-0.2 text-primary group-open:rotate-90 transition-transform motion-reduce:transition-none"
					aria-hidden="true"
				/>
			</summary>
			<SeedSteps class="mt-5" />
		</details>
	</div>
</section>

<!-- ==================== ROADMAP ==================== -->
<section id="roadmap" class="mx-auto max-w-6xl px-6 pt-8 pb-24">
	<div class="flex flex-wrap items-baseline gap-x-4">
		<h2 class="font-display text-3xl md:text-4xl font-semibold tracking-tight">Where we are</h2>
		<span class="font-hand text-3xl text-primary -rotate-2">alpha, growing fast</span>
	</div>
	<p class="mt-2 text-foreground/80 max-w-prose">
		The core loop works and I use it daily. The roadmap is shaped by feedback from the community on
		Discord and GitHub. If you have ideas, please share them!
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
					class="relative md:mt-6 rounded-2xl px-7 pb-8 pt-10 outline-2 outline-dashed -outline-offset-8 shadow-(--shadow-lift) {col.tone ===
					'live'
						? 'outline-primary/50'
						: 'outline-foreground/25'} {i === 1
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

						{#if i === 2}
							<li class="flex items-start gap-2">
								<span
									class="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full {col.tone === 'later'
										? 'bg-foreground/50'
										: 'bg-primary'}"
								></span>
								<a
									href={siteConfig.links.githubFeatureRequests}
									target="_blank"
									rel="noreferrer"
									class="flex items-center gap-1 underline decoration-dotted"
								>
									Vote what's next on GitHub
									<ExternalLink class="size-4" />
								</a>
							</li>
						{/if}
					</ul>
				</div>
			</div>
		{/each}
	</div>
</section>

<Stitch />

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

<!-- ==================== FINAL CTA ==================== -->
<section class="mx-auto max-w-6xl px-6 pt-8">
	<div
		class="relative overflow-hidden rounded-4xl bg-primary px-6 py-14 text-center shadow-(--shadow-lift) outline-2 outline-dashed -outline-offset-12 outline-primary-foreground/50 rotate-[-0.4deg] md:px-16 md:py-20"
	>
		<div
			aria-hidden="true"
			class="pointer-events-none absolute inset-0 bg-primary-foreground/15 mask-[url('/food-pattern.svg')] mask-size-[630px_540px]"
		></div>
		<div class="relative">
			<img
				src="/cuicuit_waving.png"
				alt=""
				aria-hidden={true}
				width="96"
				height="96"
				loading="lazy"
				class="mx-auto h-24 w-24 -rotate-6 mb-2 drop-shadow-md"
			/>
			<h2
				class="mt-4 font-display text-4xl md:text-6xl font-semibold tracking-tight text-primary-foreground text-balance"
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
			</div>
			<p class="mt-8 font-hand text-2xl text-primary-foreground rotate-1">
				Self-hosting is on its way. C'est cuicuit!
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
				Hi! I'm Pierre 😊 I made Cuicuit for myself and hope it'll be useful for more people.
				Supporters help me cover hosting and recipe import costs while I build in the open. You can
				also help by starring Cuicuit on GitHub or sharing feedback on Discord.
				<br />
				Thank you!
			</p>
			<a
				href="/supporter"
				aria-haspopup={media.md ? 'dialog' : undefined}
				onclick={openSupportWall}
				class="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-foreground/30 px-5 text-sm font-semibold hover:bg-secondary"
			>
				<Heart class="h-4 w-4 text-primary" /> Support Cuicuit
			</a>
		</div>
		<div class="flex flex-col gap-1 text-sm text-foreground/80 md:items-end md:justify-center">
			<a href="/changelog" class="inline-flex min-h-9 items-center gap-2 hover:text-foreground">
				What&rsquo;s New
				<Megaphone class="h-4 w-4" />
			</a>
			<a
				href={githubUrl}
				target="_blank"
				rel="noreferrer"
				class="inline-flex min-h-9 items-center gap-2 hover:text-foreground"
			>
				Star on GitHub
				<GitHub class="h-4 w-4" />
			</a>
			<a
				href={siteConfig.links.discord}
				target="_blank"
				rel="noreferrer"
				class="inline-flex min-h-9 items-center gap-2 hover:text-foreground"
			>
				Join Discord
				<Discord class="h-4 w-4" />
			</a>
			<div class="flex items-center mt-4 text-sm text-foreground/80">
				Theme
				<ThemeButton class="inline-flex size-8 justify-center" />
			</div>
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
