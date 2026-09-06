<script lang="ts">
	import { goto } from '$app/navigation';
	import ThemeButton from '$lib/shared/components/ThemeButton.svelte';
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';
	import GitHub from '$lib/shared/icons/github.svelte';
	import {
		ArrowRight,
		BookOpen,
		CalendarDays,
		Camera,
		Check,
		CircleQuestionMark,
		ExternalLink,
		Globe,
		Heart,
		Server,
		Share,
		ShoppingBasket,
		Sidebar,
		Smartphone,
		Sparkles,
		Terminal,
		TriangleAlert,
		Users
	} from '@lucide/svelte';
	import GlassScreenshots from './GlassScreenshots.svelte';
	import SupportWallAutoDialog from './supporter/success/SupportWallAutoDialog.svelte';

	const { data } = $props();

	const howToSteps = [
		{
			icon: BookOpen,
			step: '01',
			title: 'Paste a recipe link',
			body: 'From any food blog. We parse ingredients, steps, timings and guessed filters.',
			image: '/hero/mockups/iphone_recipes.png'
		},
		{
			icon: CalendarDays,
			step: '02',
			title: 'Drop it in your plan',
			body: 'Drag meals into a flexible plan. Scale servings, tweak, or swap ingredients easily.',
			image: '/hero/mockups/iphone_plan.png'
		},
		{
			icon: ShoppingBasket,
			step: '03',
			title: 'Just go shopping!',
			body: 'An aisle-aware list appears. Check things off as you cruise the store.',
			image: '/hero/mockups/iphone_list.png'
		}
	];

	const features = [
		{
			icon: Sidebar,
			title: 'The magic sidebar',
			body: 'Throw ideas and missing things in the sidebar, and your list gets immediately organized.',
			mobile: true
		},
		{
			icon: BookOpen,
			title: 'Import from anywhere',
			body: 'Paste a link from your food blog, Cuicuit pulls the recipe and guesses convenient filters.',
			mobile: false
		},
		{
			icon: Share,
			title: 'Export, Share & Connect',
			body: 'Cuicuit aims to provide open connectors like a REST API, AI MCP, and file exporting. Soon!',
			mobile: true
		},
		{
			icon: Users,
			title: 'Shared households',
			body: 'Cook together. Invite family or roommates into shared spaces that stay in sync.',
			mobile: true
		},
		{
			icon: Smartphone,
			title: 'Mobile-friendly',
			body: 'Install Cuicuit on your phone as a PWA and take your list to the store. No app store (yet).',
			mobile: false
		},
		{
			icon: Server,
			title: 'Yours to self-host',
			body: 'Open source and Docker-friendly. Keep your recipes, plans, and data on your own hardware.',
			mobile: true
		}
	];

	const roadmap = [
		{
			emoji: '🥚',
			label: 'Open Foundations',
			note: 'Project setup, hosted version, basic multi-user support.',
			items: ['Publicly hosted version', 'Docker deployment', 'Self-hosted docs', 'Many bugfixes'],
			state: 'In Progress',
			tone: 'active',
			mobile: true
		},
		{
			emoji: '🐣',
			label: 'Import → Shop',
			note: 'The core loop: recipes, meal plan, shopping list.',
			items: [
				'Import from websites',
				'Shared households',
				'Auto shopping list',
				'Past purchase suggestions'
			],
			state: 'In Progress',
			tone: 'active',
			mobile: true
		},
		{
			emoji: '🐥',
			label: 'Pantry-Aware',
			note: "Track what's in your fridge and get smarter suggestions.",
			items: [
				'Pantry management',
				'Recipe "cookability"',
				'Expiration & Easy imports',
				'Ingredient substitutions'
			],
			state: 'Planned',
			tone: 'soon',
			mobile: true
		},
		{
			emoji: '🐓',
			label: 'Habits & Smartness',
			note: 'The app learns your patterns and saves you even more time.',
			items: ['Consumption habits', 'Smart recommendations', 'Timeline & stats', 'LLM assistant'],
			state: 'Planned',
			tone: 'soon',
			mobile: false
		}
	];

	const faqs = [
		{
			q: 'What is Cuicuit?',
			a: "Cuicuit is an open-source meal planning app that imports recipes from any website, helps you plan your week, and automatically builds a beautiful aisle-aware shopping list. More features like pantry-aware meal recommendations coming soon. It's free to self-host and offers a free hosted version.",
			id: 'experiment'
		},
		{
			q: 'Is Cuicuit really free?',
			a: "Yes, and I hope forever! The full code is open source on GitHub and you can self-host it forever at no cost. The hosted cloud version also has an unlimited free plan, funded by a community moneypot. Only genuinely costly backend features need 'seeds' as a way to share the costs, use the app daily for free. I hope to see enough supporters to keep the app free."
		},
		{
			q: 'How does recipe import work?',
			a: 'Paste any recipe URL (food blog, magazine, or personal site) and Cuicuit parses the ingredients, quantities, steps, and timings using open web standards like schema.org/Recipe. Behind the scenes, it then uses AI to guess filters, ingredient substitutions, and more.'
		},
		{
			q: 'Can I self-host Cuicuit with Docker?',
			a: "Yes. Cuicuit ships with a docker-compose setup. Clone the repo, run 'docker compose up -d', and you'll have your own instance running in minutes. Your recipes and data stay on your hardware."
		},
		{
			q: 'Where does the name Cuicuit come from?',
			a: "Cuicuit is a play on words. In French, 'cui-cui' is the sound a bird makes, and 'cuit' means cooked. 'C'est cuit' is a French expression meaning 'it's cooked', so now we can say 'C'est cuicuit'! Pronounce it 'qui-qui(ck)' without the 'ck'."
		},
		{
			q: 'Can my family or roommates share a meal plan with me?',
			a: 'Absolutely. Shared households let multiple people cook, plan, and shop together in the same synced space.'
		}
	];

	let openSupportDialog = $state(false);
	let media = useMedia();
	function openSupportWall() {
		if (media.md) openSupportDialog = true;
		else goto('/supporter');
	}
</script>

<svelte:head>
	<title>Cuicuit — Import recipes, plan meals, shop smarter</title>
	<meta
		name="description"
		content="Cuicuit is an open-source kitchen companion that imports recipes from any website, helps you plan your week, and builds an aisle-aware shopping list. Free to self-host, free hosted version available."
	/>
	<meta property="og:title" content="Cuicuit — Your kitchen companion" />
	<meta
		property="og:description"
		content="Import recipes from any website, plan your meals, get a smart shopping list. Open-source and free."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://cuicuit.laclau.dev" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Cuicuit — Your kitchen companion" />
	<meta
		name="twitter:description"
		content="Import recipes from any website, plan your meals, get a smart shopping list. Open-source and free."
	/>
	<link rel="canonical" href="https://cuicuit.laclau.dev" />
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "SoftwareApplication",
			"name": "Cuicuit",
			"applicationCategory": "FoodApplication",
			"operatingSystem": "Web",
			"description": "Open-source meal planning app that imports recipes from any website and builds smart shopping lists.",
			"url": "https://cuicuit.laclau.dev",
			"offers": {
				"@type": "Offer",
				"price": "0",
				"priceCurrency": "EUR"
			},
			"softwareVersion": "Alpha",
			"openSource": true
		}
	</script>
</svelte:head>

<!-- ==================== HERO ==================== -->
<section id="top" class="relative overflow-hidden bg-(--gradient-warm)">
	<div
		aria-hidden={true}
		class="pointer-events-none absolute -top-40 -right-40 h-180 w-180 rounded-full bg-primary/5 lg:bg-primary/8 blur-[120px]"
	></div>
	<div
		aria-hidden={true}
		class="pointer-events-none absolute top-60 -left-56 h-160 w-160 rounded-full bg-primary/4 blur-[130px]"
	></div>
	<div
		aria-hidden={true}
		class="pointer-events-none absolute -bottom-40 left-1/3 h-130 w-130 rounded-full bg-(--clay)/15 blur-[110px]"
	></div>

	<div class="relative mx-auto max-w-6xl px-6 pt-16 pb-8">
		<div class="flex flex-col items-center text-center">
			<!-- Mascot greeting -->
			<div class="relative mb-6">
				<img
					src="/cuicuit_waving.png"
					alt="Cuicuit the chick waving hello"
					class="h-14 w-14 md:h-16 md:w-16 drop-shadow-lg"
				/>
				<span class="absolute -top-2 -right-10 font-hand text-lg text-primary rotate-6 select-none">
					welcome!
				</span>
			</div>

			<h1
				class="font-hand max-[420px]:text-5xl text-6xl sm:text-7xl md:text-7xl font-semibold leading-[0.9] tracking-tight md:px-3"
			>
				Think about meals,
				<br class="block lg:hidden" />
				<span class="relative inline-block text-primary">
					not ingredients.
					<svg
						aria-hidden={true}
						viewBox="0 0 300 18"
						preserveAspectRatio="none"
						class="absolute -bottom-2 left-0 w-full h-4 text-primary/50"
					>
						<path
							d="M4 12 Q 60 4, 120 10 T 240 10 T 296 8"
							fill="none"
							stroke="currentColor"
							stroke-width="4"
							stroke-linecap="round"
						/>
					</svg>
				</span>
			</h1>

			<p class="mt-6 px-6 max-w-xl text-lg text-muted-foreground text-balance leading-relaxed">
				Simply jot down meal ideas & things you're missing, and get a ready-to-shop list.
			</p>

			<p class="mt-2 text-sm text-muted-foreground/70">
				Open-source · Self-hostable · Hosted version
			</p>

			<div class="mt-12 flex flex-wrap justify-center gap-3">
				<a
					href="/signup"
					class="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-(--shadow-lift) hover:-translate-y-0.5 transition"
				>
					Sign up free <ArrowRight class="h-4 w-4" />
				</a>
				<a
					href="https://github.com/MadeInPierre/cuicuit"
					target="_blank"
					rel="noreferrer"
					class="inline-flex items-center gap-2 rounded-full border border-border bg-card px-7 py-3 text-sm font-semibold text-foreground hover:bg-secondary transition"
				>
					<GitHub class="h-4 w-4" />
					Self-host it
				</a>
			</div>
		</div>

		<!-- App screenshots -->
		<div class="relative mt-14 mx-auto max-w-5xl">
			<div
				aria-hidden={true}
				class="absolute inset-x-10 -bottom-6 h-16 rounded-full bg-primary/20 blur-2xl"
			></div>
			<GlassScreenshots />
		</div>
	</div>
</section>

<section class="relative">
	<div class="mx-auto max-w-6xl px-6 py-10 md:py-14">
		<div aria-hidden={true} class="relative -mt-8 md:-mt-10 mb-2">
			<svg
				viewBox="0 0 520 140"
				class="mx-auto h-full w-60 text-muted-foreground/50"
				fill="none"
				stroke="currentColor"
				stroke-width="4"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<!-- <path d="M60 128 Q 140 128, 220 40" /> -->
				<path d="M140 128 Q 210 100, 220 40" />
				<path d="M208 46 L 220 36 L 228 50" />

				<path d="M260 128 L 260 40" />
				<path d="M248 50 L 260 36 L 272 50" />

				<path d="M380 128 Q 310 100, 300 40" />
				<path d="M292 50 L 300 36 L 312 46" />
			</svg>
		</div>

		<div class="text-center">
			<span class="font-hand text-2xl text-muted-foreground/80">import from anywhere*</span>
			<!-- <h3 class="mt-1 font-display text-2xl md:text-3xl font-semibold tracking-tight">
					Import from anywhere
				</h3> -->
		</div>

		<div
			class="mt-4 flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 mx-4 md:mx-10 text-xs text-muted-foreground/80"
		>
			<div class="flex items-center justify-center gap-1.5 sm:gap-2">
				<Globe class="h-5 w-5" />

				Websites
			</div>

			<div class="flex items-center justify-center gap-1.5 sm:gap-2">
				<Camera class="h-5 w-5" />

				Photos
			</div>

			<div class="flex items-center justify-center gap-1.5 sm:gap-2">
				<BookOpen class="h-5 w-5" />

				Any Text
			</div>

			<!-- <div class="flex items-center justify-center gap-1.5 sm:gap-2">
				<svg
					viewBox="0 0 24 24"
					class="h-5 w-5"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<circle cx="12" cy="12" r="10" />
					<circle cx="12" cy="12" r="4" />
					<path d="M12 8a4 4 0 0 1 3.5 2h5.5" />
					<path d="M8 14a4 4 0 0 1 0-4L4.5 6" />
					<path d="M15 14.5a4 4 0 0 1-6 0l-2.5 4.5" />
				</svg>

				Chrome
			</div> -->

			<div class="flex items-center justify-center gap-1.5 sm:gap-2">
				<svg
					viewBox="0 0 24 24"
					class="h-5 w-5"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<rect x="2" y="2" width="20" height="20" rx="5" />
					<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
					<line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
				</svg>

				Instagram
			</div>

			<div class="flex items-center justify-center gap-1.5 sm:gap-2">
				<svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor">
					<path
						d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"
					/>
				</svg>

				TikTok
			</div>

			<div class="flex items-center justify-center gap-1.5 sm:gap-2">
				<svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor">
					<path
						d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.81zM9.55 15.5V8.5l6.27 3.5-6.27 3.5z"
					/>
				</svg>

				YouTube
			</div>

			<div class="flex items-center justify-center gap-1.5 sm:gap-2">
				<svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor">
					<path
						d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"
					/>
				</svg>

				Facebook
			</div>

			<div class="flex items-center justify-center gap-1.5 sm:gap-2">
				<svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor">
					<path
						d="M12 2C6.5 2 2 6.5 2 12c0 4.2 2.6 7.8 6.3 9.3-.1-.8-.2-2 0-2.8.2-.7 1.3-4.7 1.3-4.7s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.8 0 1.2.6 1.2 1.4 0 .8-.5 2.1-.8 3.2-.2 1 .5 1.8 1.5 1.8 1.8 0 3.2-1.9 3.2-4.6 0-2.4-1.7-4.1-4.2-4.1-2.9 0-4.6 2.1-4.6 4.4 0 .9.3 1.8.7 2.3.1.1.1.2.1.3l-.3 1c0 .2-.1.2-.3.1-1.1-.5-1.8-2.1-1.8-3.4 0-2.8 2-5.3 5.8-5.3 3 0 5.4 2.2 5.4 5.1 0 3-1.9 5.4-4.5 5.4-.9 0-1.7-.5-2-1l-.5 2.1c-.2.7-.7 1.6-1 2.1.7.2 1.5.4 2.3.4 5.5 0 10-4.5 10-10S17.5 2 12 2z"
					/>
				</svg>

				Pinterest
			</div>

			<div class="flex items-center justify-center gap-1.5 sm:gap-2">
				<svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor">
					<path
						d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
					/>
				</svg>

				Twitter / X
			</div>
		</div>

		<p class="mt-4 italic text-center text-xs text-muted-foreground/60">
			* Social media coming soon, Cuicuit is young! Most websites supported.
		</p>
	</div>
</section>

<section class="relative mx-auto max-w-6xl px-6 mt-28">
	<div class="text-center max-w-2xl mx-auto">
		<span class="font-hand text-2xl text-primary">how it works</span>
		<h2 class="mt-1 font-display text-3xl md:text-4xl font-semibold tracking-tight">
			Three little steps
		</h2>
	</div>
	<div class="relative mt-14 grid gap-6 md:grid-cols-3">
		{#each howToSteps as { icon: Icon, step, title, body, image }, i (step)}
			<div class="relative">
				{#if image}
					<img src={image} class="md:px-6 mx-auto max-w-80 md:max-w-full" alt="Mobile Screenshot" />
				{/if}

				<div class="relative transition group max-w-70 mx-auto">
					<!-- {#if image}
						<img src={image} class="aspect-square w-60 mx-auto" alt="Step 1" />
					{:else}
						<div
							class="hidden md:grid mb-6 place-items-center h-14 w-14 rounded-2xl bg-primary/10 group-hover:bg-primary text-primary group-hover:text-white transition-colors"
						>
							<Icon class="h-6 w-6" />
						</div>
					{/if} -->

					<div class="flex items-center justify-center space-x-4">
						<div class="font-hand text-4xl text-primary/70 leading-none">{step}</div>
						<h3 class="mt-1 font-display text-xl font-semibold">{title}</h3>
						<!-- <div
							class="md:hidden ml-auto grid place-items-center size-10 md:size-14 rounded-lg bg-primary/10 group-hover:bg-primary text-primary group-hover:text-white transition-colors"
						>
							<Icon class="h-6 w-6" />
						</div> -->
					</div>
					<p class="mt-2 text-sm text-muted-foreground leading-relaxed text-center text-balance">
						{body}
					</p>
				</div>
				{#if i < 2}
					<!-- Desktop -->
					<svg
						aria-hidden={true}
						viewBox="0 0 80 40"
						class="hidden md:block absolute -right-10 top-64 w-16 h-10 text-primary/60 z-10"
					>
						<path
							d="M4 20 Q 30 4, 60 20 T 74 22"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
							stroke-linecap="round"
							stroke-dasharray="1 5"
						/>
						<path
							d="M66 14 L74 22 L64 28"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>

					<!-- Mobile -->
					<svg
						aria-hidden={true}
						viewBox="0 0 40 80"
						class="md:hidden absolute right-3 -bottom-8 w-10 h-12 text-primary/60 z-10"
					>
						<path
							d="M20 4 Q36 30 20 60 T20 74"
							fill="none"
							stroke="currentColor"
							stroke-width="4"
							stroke-linecap="round"
							stroke-dasharray="1 5"
						/>
						<path
							d="M14 66 L20 74 L26 66"
							fill="none"
							stroke="currentColor"
							stroke-width="4"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				{/if}
			</div>
		{/each}
	</div>
</section>

<!-- ==================== FEATURES ==================== -->
<section id="features" class="relative mx-auto max-w-6xl px-6 mt-32 scroll-mt-24">
	<div class="max-w-2xl relative">
		<span class="font-hand text-2xl text-primary">features</span>

		<h2 class="font-display text-4xl md:text-5xl font-semibold tracking-tight">
			What makes it
			<span class="relative inline-block text-primary">
				different
				<svg
					aria-hidden={true}
					viewBox="0 0 180 14"
					preserveAspectRatio="none"
					class="absolute -bottom-1.5 left-0 w-full h-3.5 text-primary/45"
				>
					<path
						d="M4 10 Q 40 3, 90 9 T 176 7"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						stroke-linecap="round"
					/>
				</svg>
			</span>
		</h2>
		<p class="mt-4 text-muted-foreground">An app that is discreet, intuitive &amp; open.</p>
	</div>

	<div class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
		{#each features.filter((f) => media.sm || (f.mobile && !media.sm)) as { icon: Icon, title, body }, i (title)}
			<article
				class={`group flex items-center gap-6 sm:gap-0 sm:grid relative isolate overflow-hidden rounded-2xl bg-card p-4 md:p-6 shadow-(--shadow-soft) hover:shadow-(--shadow-lift) origin-[50%_100%] transition-all duration-300 hover:-translate-y-1.5 ${media.md ? (i % 2 === 0 ? 'rotate-[-0.45deg] hover:rotate-0' : 'rotate-[0.45deg] hover:rotate-0') : ''}`}
			>
				<div
					class="grid place-items-center h-12 w-12 min-w-12 rounded-[34%_66%_58%_42%/44%_40%_60%_56%] bg-primary/12 text-primary transition-all duration-300 group-hover:rounded-xl group-hover:bg-primary group-hover:text-primary-foreground"
				>
					<Icon class="h-5 w-5 min-w-5" />
				</div>

				<div class="grid sm:mt-6">
					<h3 class="font-display text-xl font-semibold">{title}</h3>
					<p class="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
				</div>

				<svg
					aria-hidden={true}
					viewBox="0 0 180 20"
					class="pointer-events-none absolute bottom-4 right-5 h-3 w-20 translate-y-0.5 text-primary/55 opacity-45 transition-[opacity,transform] duration-200 group-hover:translate-y-0 group-hover:opacity-90"
				>
					<path
						d="M4 11 Q 30 3, 60 11 T 120 11 T 176 8"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						stroke-linecap="round"
					/>
				</svg>
			</article>
		{/each}
	</div>
</section>

<section id="roadmap" class="mx-auto max-w-6xl px-6 mt-32 scroll-mt-24">
	<div class="text-center mx-auto">
		<span class="font-hand text-2xl text-primary">roadmap</span>
		<h2 class="mt-1 font-display text-4xl md:text-5xl font-semibold tracking-tight">
			Cuicuit just hatched 👋
		</h2>
		<p class="mt-4 mx-auto max-w-2xl text-muted-foreground text-balance">
			Cuicuit wants to be the best everything-kitchen app, see the roadmap and vote to change it!
		</p>
	</div>

	<div class="mt-14">
		<ol class="grid gap-[1.35rem] md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
			{#each roadmap.filter((r) => media.sm || r.mobile) as r, i (r.label)}
				<li class="relative lg:even:mt-8">
					<article
						class={`relative grid sm:flex sm:gap-6 sm:items-center md:grid md:gap-0 rounded-2xl bg-card p-6 shadow-(--shadow-soft) transition-all duration-200 hover:-translate-y-1 hover:shadow-(--shadow-lift) after:pointer-events-none after:absolute after:right-[1.1rem] after:bottom-[0.7rem] after:h-3 after:w-[4.4rem] after:opacity-40 after:content-[''] after:[background:radial-gradient(circle_at_10%_50%,var(--primary)_0.1rem,transparent_0.12rem)_0_50%/0.66rem_100%_repeat-x] ${media.lg ? (i % 2 === 0 ? 'rotate-[-0.7deg] hover:rotate-0' : 'rotate-[0.7deg] hover:rotate-0') : ''}`}
					>
						<div class="grid w-full">
							<span
								class={'absolute top-5 right-5 rounded-full px-2.5 py-1 text-[10px] font-semibold ' +
									(r.tone === 'active'
										? 'bg-amber-100 text-primary'
										: 'bg-muted/40 text-muted-foreground')}
							>
								{r.tone === 'active' ? '🚧 ' : ''}{r.state}
							</span>
							<div class="text-4xl leading-none select-none">{r.emoji}</div>
							<div
								class="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
							>
								Step {i}
							</div>
							<div class="mt-1 font-display text-xl font-semibold leading-snug">
								{r.label}
							</div>
							<p class="mt-2 text-sm text-muted-foreground leading-relaxed">{r.note}</p>
						</div>

						<div class="grid min-w-50">
							<ul class="mt-5 space-y-1.5 text-sm text-foreground/80">
								{#each r.items as item (item)}
									<li class="flex items-start gap-2">
										<span class="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/65"
										></span>
										{item}
									</li>
								{/each}
							</ul>
						</div>
					</article>

					{#if i < roadmap.filter((r) => media.sm || r.mobile).length - 1}
						<svg
							aria-hidden={true}
							viewBox="0 0 64 96"
							class="pointer-events-none absolute left-1/2 bottom-[-4.9rem] z-10 h-[5.3rem] w-[3.6rem] -translate-x-1/2 rotate-[4deg] text-[color-mix(in_oklab,var(--primary)_58%,var(--muted-foreground))] opacity-70 md:hidden"
						>
							<path
								d="M32 8 C 50 30, 14 48, 32 72"
								fill="none"
								stroke="currentColor"
								stroke-width="2.4"
								stroke-linecap="round"
								stroke-dasharray="5 6"
							/>
							<path
								d="M24 62 L32 74 L40 62"
								fill="none"
								stroke="currentColor"
								stroke-width="2.4"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>

						<svg
							aria-hidden={true}
							viewBox="0 0 220 92"
							class={`pointer-events-none absolute top-[44%] -right-8 z-15 hidden h-10 w-14 -translate-y-1/2 text-[color-mix(in_oklab,var(--primary)_58%,var(--muted-foreground))] opacity-70 lg:block ${i % 2 === 0 ? 'lg:rotate-[-4deg]' : 'lg:rotate-[4deg]'}`}
						>
							<path
								d="M8 64 C 68 18, 150 18, 208 62"
								fill="none"
								stroke="currentColor"
								stroke-width="8"
								stroke-linecap="round"
								stroke-dasharray="5 6"
							/>
							<path
								d="M194 50 L208 62 L188 64"
								fill="none"
								stroke="currentColor"
								stroke-width="8"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					{/if}
				</li>
			{/each}
		</ol>
	</div>

	<div class="mt-10 flex justify-center">
		<a
			href="https://github.com/MadeInPierre/cuicuit/discussions/categories/ideas"
			target="_blank"
			rel="noreferrer"
			class="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold shadow-(--shadow-soft) hover:bg-secondary transition"
		>
			<span class="mr-1">🙌</span>
			Vote for features on GitHub <ArrowRight class="h-4 w-4" />
		</a>
	</div>
</section>

<!-- ==================== PRICING ==================== -->
<section id="pricing" class="relative mx-auto max-w-6xl px-6 mt-32 scroll-mt-24">
	<div class="text-center max-w-2xl mx-auto">
		<span class="font-hand text-2xl text-primary">pricing</span>

		<h2 class="font-display text-4xl md:text-5xl font-semibold tracking-tight">
			Pick your nest 🪺
		</h2>
		<p class="mt-4 text-muted-foreground">
			Free forever if you self-host. A crowd-funded hosted version if you'd rather it just works.
		</p>
	</div>

	<div class="mt-12 grid gap-6 md:grid-cols-3">
		<!-- Self-hosted -->
		<div
			class="rounded-2xl order-2 md:order-1 bg-neutral-950 text-neutral-100 p-8 shadow-(--shadow-soft) border border-neutral-900 flex flex-col"
		>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2 text-sm font-semibold text-white">
					<Terminal class="h-4 w-4" /> Self-hosted
				</div>
				<span
					class="rounded-full bg-green-950 text-green-500 px-2.5 py-1 text-[11px] font-semibold"
				>
					Free forever
				</span>
			</div>
			<p class="mt-4 text-sm text-neutral-400 leading-relaxed">
				Open-source, privacy-first, and yours to run. Dockerized deployment is on the way.
			</p>
			<pre
				class="mt-5 rounded-xl bg-neutral-900/70 border border-neutral-800 p-4 text-[12.5px] leading-relaxed font-mono text-neutral-200 overflow-x-clip"><span
					class="text-neutral-500"># available soon</span
				>
<span class="text-primary">$</span> docker compose up -d
<span class="text-emerald-400">✓</span> <span class="text-neutral-400"
					>serving on localhost:3000</span
				></pre>
			<a
				href="https://github.com/MadeInPierre/cuicuit"
				target="_blank"
				rel="noreferrer"
				class="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full bg-neutral-800 text-neutral-100 px-5 py-3 text-sm font-semibold hover:bg-neutral-700 transition"
			>
				<GitHub class="h-4 w-4" />
				Read the docs <ExternalLink class="size-4" />
			</a>
		</div>

		<!-- Supporter -->
		<div
			class="relative rounded-2xl order-3 md:order-2 border-2 border-pink-500 bg-card p-8 shadow-(--shadow-lift) md:-translate-y-3 flex flex-col"
		>
			<span
				class="absolute w-max -top-3 left-1/2 -translate-x-1/2 rounded-full bg-pink-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white"
			>
				SUPPORT THE PROJECT
			</span>
			<div class="flex items-center gap-2 text-sm font-semibold text-pink-500">
				<Heart class="h-4 w-4" />
				Supporter
			</div>
			<div class="mt-4 font-display text-4xl font-semibold">Any amount</div>
			<p class="mt-1 text-sm text-muted-foreground">5 € = 100 seeds 🌱 ≈ 100 recipe imports</p>
			<ul class="mt-6 space-y-3 text-sm">
				{#each ['Get your own seeds for some features', "Accelerate Cuicuit's development", 'A very warm thank-you 🩷'] as t (t)}
					<li class="flex items-start gap-2">
						<Check class="h-4 w-4 mt-0.5 text-pink-500 shrink-0" />
						{t}
					</li>
				{/each}
			</ul>
			<button
				onclick={openSupportWall}
				class="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full bg-pink-500 px-5 py-3 text-sm font-semibold text-white hover:opacity-90 transition"
			>
				Support <Heart class="h-4 w-4" fill="#ffffff" /> & Get seeds 🌱
			</button>
		</div>

		<!-- Hosted -->
		<div
			class="h-90 rounded-2xl order-1 md:order-3 border border-border bg-card p-8 shadow-(--shadow-soft) flex flex-col"
		>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2 text-sm font-semibold">
					<Sparkles class="h-4 w-4" /> Hosted
				</div>
				<a
					href="#experiment"
					class="rounded-full flex items-center gap-1 shrink-0 bg-muted/40 text-muted-foreground px-2.5 py-1 text-[11px] font-semibold"
				>
					Free forever <CircleQuestionMark class="size-3" />
				</a>
			</div>
			<div class="mt-4 font-display text-4xl font-semibold">
				Free
				<span class="text-base font-normal text-muted-foreground">
					as a 🐤
					<span class="sr-only">bird</span>
				</span>
			</div>
			<p class="mt-1 text-sm text-muted-foreground">No credit card.</p>
			<ul class="mt-6 space-y-3 text-sm">
				{#each ['All features free with fair usage limits', 'Community seeds gifted by supporters'] as t (t)}
					<li class="flex items-start gap-2">
						<Check class="h-4 w-4 mt-0.5 shrink-0" />
						{t}
					</li>
				{/each}

				<li class="flex items-start gap-2 text-amber-600">
					<TriangleAlert class="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
					Paused if not enough supporters
				</li>
			</ul>
			<a
				href="/signup"
				class="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-5 py-3 text-sm font-semibold hover:bg-secondary transition"
			>
				Sign up on Hosted <ArrowRight class="h-4 w-4" />
			</a>
		</div>
	</div>

	<!-- Seeds explanation -->
	<div class="relative mt-10 max-w-4xl mx-auto">
		<div class="flex flex-col items-center">
			<svg aria-hidden={true} viewBox="0 0 40 56" class="w-5 h-12 text-muted-foreground/60">
				<path
					d="M20 4 L 20 44"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-dasharray="4 4"
				/>
				<path
					d="M12 36 L 20 46 L 28 36"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>

			<h3 class="mt-1 font-display text-2xl md:text-3xl font-semibold tracking-tight">
				What are seeds? 🌱
			</h3>

			<p class="mt-2 mx-4 text-balance text-sm text-muted-foreground max-w-2xl text-center">
				Cuicuit believes in a fair open concept: all features are free except costly ones to host.
				<br class="hidden sm:block" />
				By supporting Cuicuit, you get your own seeds to use and give some to all users:
			</p>

			<!-- <span class="mt-8 font-hand text-2xl text-muted-foreground">where your money goes:</span> -->
		</div>

		<!-- Money breakdown bar -->
		<div class="relative p-2 mt-6">
			<!-- <span
				class="absolute right-12 top-13 sm:-top-2 md:-top-4 text-right mb-2 text-muted-foreground/60 text-sm sm:text-md font-hand"
			>
				+ Your country's VAT
			</span> -->

			<div
				class="h-10 md:h-12 w-full rounded-full overflow-hidden flex drop-shadow-md border-4 border-white dark:border-primary"
			>
				<div
					class="basis-30/100 flex items-center justify-center text-[11px] md:text-xs text-foreground dark:text-muted bg-blue-300"
				>
					<div class="flex flex-col items-center">
						<span class="font-semibold">30%</span>
						<span>Yours</span>
					</div>
				</div>
				<div
					class="basis-15/100 flex items-center justify-center text-[11px] md:text-xs text-foreground dark:text-muted bg-pink-300"
				>
					<div class="flex flex-col items-center">
						<span class="font-semibold">15%</span>
						<span>Community</span>
					</div>
				</div>
				<div
					class="basis-15/100 flex items-center justify-center text-[11px] md:text-xs text-foreground dark:text-muted bg-lime-300"
				>
					<div class="flex flex-col items-center">
						<span class="font-semibold">15%</span>
						<span class="hidden sm:inline-block">Development</span>
						<span class="inline-block sm:hidden">Dev.</span>
					</div>
				</div>
				<div
					class="basis-1/10 flex items-center justify-center text-[11px] md:text-xs text-foreground dark:text-muted bg-gray-200 border-r-2 border-gray-300 border-dashed"
				>
					<div class="flex flex-col items-center">
						<span class="font-semibold">10%</span>
						<span>Fees</span>
					</div>
				</div>
				<div
					class="basis-3/10 flex items-center justify-center text-[11px] md:text-xs text-foreground dark:text-muted bg-gray-200"
				>
					<div class="flex flex-col items-center">
						<span class="font-semibold">30%</span>
						<span>Taxes</span>
					</div>
				</div>
			</div>

			<div class="mt-6 grid gap-4 sm:grid-cols-4 text-sm">
				<div class="flex gap-3">
					<span class="mt-1 h-3 w-3 rounded-full bg-blue-300 shrink-0"></span>
					<div>
						<p class="font-semibold">Personal Seeds 🌱</p>
						<p class="text-muted-foreground text-xs leading-relaxed">
							Reserved for you. Shared if unused after 12 months.
						</p>
					</div>
				</div>
				<div class="flex gap-3">
					<span class="mt-1 h-3 w-3 rounded-full bg-pink-300 shrink-0"></span>
					<div>
						<p class="font-semibold">Community Seeds 🌱</p>
						<p class="text-muted-foreground text-xs leading-relaxed pr-2">
							Used by free users with fair usage &amp; rate limits.
						</p>
					</div>
				</div>
				<div class="flex gap-3">
					<span class="mt-1 h-3 w-3 rounded-full bg-lime-300 shrink-0"></span>
					<div>
						<p class="font-semibold">Servers & Development</p>
						<p class="text-muted-foreground text-xs leading-relaxed">
							Server bills, tools, and my salary to maintain &amp; improve Cuicuit.
						</p>
					</div>
				</div>
				<div class="flex gap-3">
					<span class="mt-1 h-3 w-3 rounded-full bg-gray-300 shrink-0"></span>
					<div>
						<p class="font-semibold">Taxes & Fees</p>
						<p class="text-muted-foreground text-xs leading-relaxed">
							<!-- Approx. half of your contribution goes to VAT, taxes and fees. -->
							Cuicuit is seen as a regular software product for taxes.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ==================== FAQ ==================== -->
<section id="faq" class="mx-auto max-w-4xl px-6 mt-32 scroll-mt-24">
	<div class="text-center max-w-2xl mx-auto">
		<h2 class="font-display text-4xl md:text-5xl font-semibold tracking-tight">
			Questions & <span class="italic text-primary">Answers</span>
		</h2>
		<p class="mt-4 text-muted-foreground">
			Everything you might wonder before you crack the first egg.
		</p>
	</div>

	<div class="mt-10 grid gap-3">
		{#each faqs as f (f.q)}
			<details id={f.id} class="group rounded-2xl p-3">
				<summary
					class="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold"
				>
					<span
						class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition group-open:rotate-45"
					>
						+
					</span>
					<span class="w-full">{f.q}</span>
				</summary>
				<p class="mt-3 ml-11 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
			</details>
		{/each}
	</div>
</section>

<!-- ==================== STORY ==================== -->
<section id="story" class="mx-auto max-w-6xl px-6 mt-32 scroll-mt-24">
	<div class="relative p-4 sm:p-8 md:p-14">
		<div class="text-center max-w-4xl mx-auto">
			<span class="font-hand text-2xl text-primary">the story behind Cuicuit</span>
			<h2 class="mt-2 font-display text-4xl md:text-5xl font-semibold tracking-tight">
				A simple <span class="relative inline-block italic text-primary">
					passion project
					<svg
						aria-hidden={true}
						viewBox="0 0 200 20"
						preserveAspectRatio="none"
						class="absolute -bottom-1 left-0 w-full h-3 text-primary/60"
					>
						<path
							d="M4 12 Q 50 4, 100 10 T 196 8"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
							stroke-linecap="round"
						/>
					</svg>
					🪶
				</span>
			</h2>

			<div class="mt-10 text-left md:text-lg text-foreground/90 leading-relaxed space-y-5">
				<p>
					Hi! I'm Pierre, the human behind this little egg 😊. Cuicuit started as an app for myself:
					I love cooking, but I hate the 6pm panic of
					<em>"what's for dinner, and what can I even do with what's in my fridge?"</em>
				</p>
				<p>
					I wanted a kitchen companion that felt <em>helpful and efficient</em>, not like other
					cooking apps that need too many clicks and attention. The philosophy is simple:
					<span class="relative inline-block font-semibold text-primary">
						think about meals, not ingredients
						<svg
							aria-hidden={true}
							viewBox="0 0 180 16"
							preserveAspectRatio="none"
							class="absolute -bottom-1 left-0 w-full h-3 text-primary/60"
						>
							<path
								d="M4 10 Q 50 16, 100 8 T 176 10"
								fill="none"
								stroke="currentColor"
								stroke-width="3"
								stroke-linecap="round"
							/>
						</svg>
					</span>. Jot down ideas at home, get a convenient list to go, and (soon) know what your
					pantry can cook.
				</p>
				<p>
					I love and rely on open source software every day. I want to give back by making the best
					OSS everything-kitchen app! Maintaining and improving Cuicuit takes a lot of effort, so I
					am exploring a crowdfunded hosted version and direct donations to keep it going.
				</p>
				<p>
					If you find it useful, a star on GitHub, voting for features, or a contribution to the
					moneypot keeps us growing. Every bit of support means more motivation to keep making
					Cuicuit the happiest little kitchen app.
				</p>
				<p>Thank you & Bon appétit! 🇫🇷🐥</p>
			</div>

			<div class="mt-10 flex flex-wrap items-center justify-center gap-4">
				<a
					href="https://github.com/MadeInPierre/cuicuit"
					target="_blank"
					rel="noreferrer"
					class="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-(--shadow-lift) hover:-translate-y-0.5 transition"
				>
					<GitHub class="h-4 w-4" /> Star on GitHub
				</a>
				<button
					onclick={openSupportWall}
					class="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold hover:bg-secondary hover:-translate-y-0.5 transition"
				>
					Support the project <Heart class="h-4 w-4 text-primary" />
				</button>
			</div>

			<p class="mt-6 text-sm text-muted-foreground italic">
				Thank you for being here. 🐣 — <a
					href="https://linkedin.com/in/pierre-laclau"
					target="_blank"
					rel="noreferrer"
					class="hover:underline decoration-dotted">Pierre</a
				>
			</p>
		</div>
	</div>
</section>

<!-- ==================== FINAL CTA ==================== -->
<section class="mx-auto max-w-6xl px-6 mt-32">
	<div
		class="relative overflow-hidden rounded-3xl bg-primary p-12 md:p-16 text-center shadow-(--shadow-lift)"
	>
		<div
			aria-hidden={true}
			class="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_60%,white,transparent_35%)]"
		></div>
		<div class="relative text-white">
			<img
				src="/cuicuit_waving.png"
				alt=""
				aria-hidden={true}
				class="mx-auto h-16 w-16 mb-4 drop-shadow-lg"
			/>
			<h2 class="font-display text-4xl md:text-5xl font-semibold tracking-tight text-white">
				C'est cuicuit. <span class="italic text-white/90">Dinner's sorted.</span>
			</h2>
			<p class="mx-auto mt-4 max-w-xl text-white/90">
				Import your first recipe in under a minute, see you on the other side!
			</p>
			<div class="mt-8 flex flex-wrap justify-center gap-3">
				<a
					href="/signup"
					class="inline-flex items-center gap-2 rounded-full bg-background text-foreground px-6 py-3 text-sm font-semibold hover:-translate-y-0.5 transition"
				>
					Sign up free <ArrowRight class="h-4 w-4" />
				</a>
				<a
					href="https://github.com/MadeInPierre/cuicuit"
					target="_blank"
					rel="noreferrer"
					class="inline-flex items-center gap-2 rounded-full border border-white/50 text-white px-6 py-3 text-sm font-semibold hover:bg-white/10 transition"
				>
					<GitHub class="h-4 w-4" /> Self-host it
				</a>
			</div>
		</div>
	</div>
</section>

<!-- ==================== FOOTER ==================== -->
<footer class="mx-auto max-w-6xl px-6 mt-24 pb-12">
	<div
		class="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-border pt-8 text-sm text-foreground/70"
	>
		<div class="flex items-center gap-2 font-medium">
			<img src="/cuicuit_logo_transparent.png" alt="Cuicuit" class="h-6" />
			<span>Cuicuit</span>
		</div>
		<p>
			Made with <Heart class="inline h-3.5 w-3.5 text-primary" /> and released as fully open-source.
		</p>
		<div class="flex items-center gap-6">
			<ThemeButton class="justify-center" />
			<a
				href="https://github.com/MadeInPierre/cuicuit"
				target="_blank"
				rel="noreferrer"
				class="inline-flex items-center gap-1.5 hover:text-foreground"
			>
				<GitHub class="h-4 w-4" /> GitHub
			</a>
		</div>
	</div>
</footer>

<SupportWallAutoDialog email={data.claims?.email || null} bind:open={openSupportDialog} />

<style>
	:global(html) {
		scroll-behavior: smooth;
	}

	.mascot-bob {
		animation: bob 3s ease-in-out infinite;
	}

	@keyframes bob {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-6px);
		}
	}
</style>
