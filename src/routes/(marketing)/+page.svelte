<script lang="ts">
	import Button from '$lib/shared/components/ui/button/button.svelte';
	import {
		Camera,
		Check,
		CircleQuestionMark,
		ExternalLink,
		Globe,
		TriangleAlert
	} from '@lucide/svelte';
	import {
		ArrowRight,
		BookOpen,
		CalendarDays,
		Github,
		Heart,
		Server,
		ShoppingBasket,
		Smartphone,
		Sparkles,
		Terminal,
		Users
	} from 'lucide-svelte';
	import SupportDialog from './SupportDialog.svelte';

	const { data } = $props();

	const howToSteps = [
		{
			icon: BookOpen,
			step: '01',
			title: 'Paste a recipe link',
			body: 'From any food blog. We handle the parsing — ingredients, steps, timings.'
		},
		{
			icon: CalendarDays,
			step: '02',
			title: 'Drop it in your plan',
			body: 'Drag meals into a flexible plan. Scale servings, tweak, or swap easily.'
		},
		{
			icon: ShoppingBasket,
			step: '03',
			title: 'Just go shopping!',
			body: 'An aisle-aware list appears — check things off as you cruise the store.'
		}
	];

	const features = [
		{
			icon: BookOpen,
			title: 'Import from anywhere',
			body: 'Paste a link from your food blog and Cuicuit pulls the recipe, ingredients, and timings.'
		},
		{
			icon: CalendarDays,
			title: 'Plan without the pain',
			body: 'Drag recipes into a simple dateless plan. Scale servings, add extras — no rigid calendar grid.'
		},
		{
			icon: ShoppingBasket,
			title: 'Shopping list that builds itself',
			body: 'Your plan turns into an aisle-aware grocery list, with smart suggestions from past purchases.'
		},
		{
			icon: Users,
			title: 'Shared households',
			body: 'Cook together. Invite family or roommates into shared spaces that stay perfectly in sync.'
		},
		{
			icon: Smartphone,
			title: 'Mobile-friendly',
			body: 'Install Cuicuit on your phone as a PWA and take your list to the store. No app store detour.'
		},
		{
			icon: Server,
			title: 'Yours to self-host',
			body: 'Open source and Docker-friendly. Keep your recipes, plans, and data on your own hardware.'
		}
	];

	const roadmap = [
		{
			emoji: '🥚',
			label: 'Open Source Foundations',
			note: 'Project setup, hosted version, basic multi-user support.',
			items: [
				'Publicly hosted version',
				'Multi-user spaces',
				'Docker deployment',
				'Self-hosted docs'
			],
			state: 'In Progress',
			tone: 'active'
		},
		{
			emoji: '🐣',
			label: 'Import, Plan & Shop',
			note: 'The core loop: recipes → meal plan → shopping list.',
			items: [
				'Import from websites',
				'Shared households',
				'Auto shopping list',
				'Past purchase suggestions'
			],
			state: 'In Progress',
			tone: 'active'
		},
		{
			emoji: '🐥',
			label: 'Pantry-Aware Planning',
			note: "Track what's in your fridge and get smarter suggestions.",
			items: [
				'Pantry management',
				'Expiration tracking',
				'Recipe "cookability"',
				'Ingredient substitutions'
			],
			state: 'Coming soon',
			tone: 'soon'
		},
		{
			emoji: '🐓',
			label: 'Habits & Intelligence',
			note: 'The app learns your patterns and saves you even more time.',
			items: ['Consumption habits', 'Smart recommendations', 'Timeline & stats', 'LLM assistant'],
			state: 'Coming soon',
			tone: 'soon'
		}
	];

	const faqs = [
		{
			q: 'What is Cuicuit?',
			a: "Cuicuit is an open-source meal planning app that imports recipes from any website, helps you plan your week, and automatically builds an aisle-aware shopping list. More features like pantry-aware meal recommendations coming soon. It's free to self-host and offers a free hosted version.",
			id: 'experiment'
		},
		{
			q: 'Is Cuicuit really free?',
			a: "Yes, and I hope forever! The full source code is on GitHub under a permissive license and you can self-host it forever at no cost. The hosted cloud version also has an unlimited free plan, funded by a community moneypot. This free plan is an experiment, I hope to see enough supporters to keep the app free for everyone. If the free version freezes too often, I might have to go back to a regular 'freemium' model — self-host your own instance or support the project if needed."
		},
		{
			q: 'How does recipe import work?',
			a: 'Paste any recipe URL — food blog, magazine, or personal site — and Cuicuit parses the ingredients, quantities, steps, and timings using open web standards like schema.org/Recipe. It then uses AI to add filters, ingredient substitutions, and more!'
		},
		{
			q: 'Can I self-host Cuicuit with Docker?',
			a: "Yes. Cuicuit ships with a docker-compose setup. Clone the repo, run 'docker compose up -d', and you'll have your own instance running in minutes. Your recipes and data stay on your hardware."
		},
		{
			q: 'Does Cuicuit work offline as a mobile app?',
			a: "Cuicuit is a Progressive Web App (PWA). Install it from your phone's browser and take your shopping list to the store — no app store required. Offline support coming soon-ish. Mobile app to be planned once Cuicuit grows enough."
		},
		{
			q: 'Can my family or roommates share a meal plan with me?',
			a: 'Absolutely. Shared households let multiple people cook, plan, and shop together in the same synced space.'
		}
	];
</script>

<div class="min-h-screen bg-background text-foreground font-sans antialiased" id="landing-root">
	<header class="sticky top-0 z-30 backdrop-blur-md bg-background/70 border-b border-border/60">
		<div class="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
			<a
				href="#top"
				class="w-60 flex items-center justify-start gap-1 text-xl font-semibold tracking-tight"
			>
				<div class="flex items-center justify-center gap-2">
					<img src="/cuicuit_logo_transparent.png" alt="Cuicuit" class="h-8" />
					<h1>Cuicuit</h1>
				</div>

				<span class="px-2 text-xl text-[#fab030] font-hand"> alpha </span>
			</a>

			<nav class="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
				<a href="#features" class="hover:text-foreground transition-colors">Features</a>
				<a href="#roadmap" class="hover:text-foreground transition-colors">Roadmap</a>
				<a href="#pricing" class="hover:text-foreground transition-colors">Pricing</a>
				<a href="#faq" class="hover:text-foreground transition-colors">FAQ</a>
				<a href="#story" class="hover:text-foreground transition-colors">Story</a>
				<a
					href="https://github.com/MadeInPierre/cuicuit"
					target="_blank"
					rel="noreferrer"
					class="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
				>
					<Github class="h-4 w-4" /> GitHub
				</a>
			</nav>

			<div class="w-60 flex items-center justify-end gap-2">
				{#if data.claims}
					<a
						href="#pricing"
						class="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-(--shadow-soft) hover:opacity-90 transition"
					>
						Back to the app <ArrowRight class="h-3.5 w-3.5" />
					</a>
				{:else}
					<Button href="/login" variant="link" size="sm">Log in</Button>
					<a
						href="#pricing"
						class="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-(--shadow-soft) hover:opacity-90 transition"
					>
						Get Started <ArrowRight class="h-3.5 w-3.5" />
					</a>
				{/if}
			</div>
		</div>
	</header>

	<section id="top" class="relative overflow-hidden bg-(--gradient-warm)">
		<div
			aria-hidden={true}
			class="pointer-events-none absolute -top-40 -right-40 h-180 w-180 rounded-full bg-primary/5 sm:bg-primary/10 md:bg-primary/15 blur-[120px]"
		></div>
		<div
			aria-hidden={true}
			class="pointer-events-none absolute top-60 -left-56 h-160 w-160 rounded-full bg-primary/5 sm:bg-primary/10 blur-[130px]"
		></div>
		<div
			aria-hidden={true}
			class="pointer-events-none absolute -bottom-40 left-1/3 h-130 w-130 rounded-full bg-(--clay)/15 blur-[110px]"
		></div>

		<div class="relative mx-auto max-w-6xl px-6 pt-20 pb-8 text-center">
			<span
				class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/70 backdrop-blur px-4 py-0.5 font-hand text-xl text-primary shadow-(--shadow-soft)"
			>
				🐣 alpha — expect rough edges &amp; bugs
			</span>
			<h1
				class="mt-8 font-display text-5xl md:text-7xl font-semibold leading-[1.02] tracking-tight text-balance"
			>
				Your favorite
				<br />
				<span class="relative inline-block text-primary">
					kitchen companion
					<svg
						aria-hidden={true}
						viewBox="0 0 600 24"
						preserveAspectRatio="none"
						class="absolute -bottom-3 left-0 w-full h-3 text-primary/60"
					>
						<path
							d="M4 14 Q 80 4, 160 12 T 320 12 T 480 12 T 596 10"
							fill="none"
							stroke="currentColor"
							stroke-width="6"
							stroke-linecap="round"
						/>
					</svg>
				</span>
			</h1>
			<p class="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground text-balance">
				No more <em class="italic">"what's for dinner?"</em>. Cuicuit imports your recipes, plans
				the week, and quietly builds the shopping list for you.
			</p>
			<div class="mt-8 flex flex-wrap justify-center gap-3">
				<a
					href="#pricing"
					class="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-(--shadow-lift) hover:-translate-y-0.5 transition"
				>
					Get Started <ArrowRight class="h-4 w-4" />
				</a>
				<a
					href="https://github.com/MadeInPierre/cuicuit"
					target="_blank"
					rel="noreferrer"
					class="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-secondary transition"
				>
					<Github class="h-4 w-4" /> Self-host for free
				</a>
			</div>
			<p class="mt-6 text-xs italic text-muted-foreground">
				🐤 <em>cui-cui</em> = bird chirp in French · <em>cuit</em> = cooked · c'est cuicuit!
			</p>

			<div class="relative mt-16 mx-auto max-w-5xl">
				<div
					aria-hidden={true}
					class="hidden md:block absolute -left-6 -top-16 rotate-[-8deg] z-10"
				>
					<span class="font-hand text-2xl text-primary/60">sneak peek</span>
					<svg viewBox="0 0 120 60" class="w-24 h-12 text-primary/70 ml-16 -mt-1">
						<path
							d="M4 8 Q 50 4, 90 30 T 116 52"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
						<path
							d="M108 44 L 116 52 L 104 54"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</div>
				<div
					aria-hidden={true}
					class="absolute inset-x-10 -bottom-6 h-16 rounded-full bg-primary/25 blur-2xl"
				></div>
				<div
					class="relative rounded-2xl border border-border bg-card p-1.5 sm:p-2 shadow-(--shadow-lift)"
				>
					<img
						src="/hero/hero_wide.png"
						alt="Screenshot of the Cuicuit app showing planned meals, recipe gallery, and shopping list."
						class="w-full rounded-xl hidden sm:block"
						loading="eager"
					/>
					<img
						src="/hero/hero_narrow.png"
						alt="Screenshot of the Cuicuit app showing planned meals, recipe gallery, and shopping list."
						class="w-full rounded-xl sm:hidden"
						loading="eager"
					/>
				</div>
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

				<div class="flex items-center justify-center gap-1.5 sm:gap-2">
					<Camera class="h-5 w-5" />

					Photos
				</div>

				<div class="flex items-center justify-center gap-1.5 sm:gap-2">
					<Globe class="h-5 w-5" />

					Websites
				</div>

				<div class="flex items-center justify-center gap-1.5 sm:gap-2">
					<BookOpen class="h-5 w-5" />

					Any Text
				</div>

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
						<circle cx="12" cy="12" r="10" />
						<circle cx="12" cy="12" r="4" />
						<path d="M12 8a4 4 0 0 1 3.5 2h5.5" />
						<path d="M8 14a4 4 0 0 1 0-4L4.5 6" />
						<path d="M15 14.5a4 4 0 0 1-6 0l-2.5 4.5" />
					</svg>

					Chrome
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
				Three little steps, <span class="italic">zero headaches</span>.
			</h2>
		</div>
		<div class="relative mt-14 grid gap-6 md:grid-cols-3">
			{#each howToSteps as { icon: Icon, step, title, body }, i (step)}
				<div class="relative">
					<div
						class="relative rounded-xl md:rounded-2xl bg-sidebar p-4 md:p-7 hover:-translate-y-1 hover:shadow-(--shadow-soft) transition group"
					>
						<div
							class="hidden md:grid mb-6 place-items-center h-14 w-14 rounded-2xl bg-primary/10 group-hover:bg-primary text-primary group-hover:text-white transition-colors"
						>
							<Icon class="h-6 w-6" />
						</div>

						<div class="flex items-center space-x-4 md:grid">
							<div class="font-hand text-3xl text-primary/70 leading-none">{step}</div>
							<h3 class="mt-1 font-display text-xl font-semibold">{title}</h3>
							<div
								class="md:hidden ml-auto grid place-items-center size-10 md:size-14 rounded-lg bg-primary/10 group-hover:bg-primary text-primary group-hover:text-white transition-colors"
							>
								<Icon class="h-6 w-6" />
							</div>
						</div>
						<p class="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
					</div>
					{#if i < 2}
						<!-- Desktop -->
						<svg
							aria-hidden={true}
							viewBox="0 0 80 40"
							class="hidden md:block absolute -right-8 top-1/2 -translate-y-1/2 w-16 h-10 text-primary/60 z-10"
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

	<section id="features" class="relative mx-auto max-w-6xl px-6 mt-32 scroll-mt-24">
		<div class="max-w-2xl relative">
			<span class="font-hand text-2xl text-primary">features</span>

			<div aria-hidden={true} class="hidden lg:block absolute -right-100 bottom-0 rotate-6">
				<span class="font-hand text-xl text-primary/70">our favorite features</span>
			</div>
			<h2 class="mt-2 font-display text-4xl md:text-5xl font-semibold tracking-tight">
				Small app, <span class="italic">big appetite</span>.
			</h2>
			<p class="mt-4 text-muted-foreground text-lg">
				Cuicuit stays out of your way and does the boring parts, so cooking feels fun again.
			</p>
		</div>

		<div class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each features as { icon: Icon, title, body } (title)}
				<article
					class="group rounded-xl bg-card p-6 shadow-(--shadow-soft) hover:shadow-(--shadow-lift) hover:-translate-y-1 transition"
				>
					<div
						class="grid place-items-center h-11 w-11 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition"
					>
						<Icon class="h-5 w-5" />
					</div>
					<h3 class="mt-5 font-display text-xl font-semibold">{title}</h3>
					<p class="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
				</article>
			{/each}
		</div>
	</section>

	<section id="roadmap" class="mx-auto max-w-6xl px-6 mt-32 scroll-mt-24">
		<div class="text-center max-w-2xl mx-auto">
			<span class="font-hand text-2xl text-primary">🗺️ roadmap</span>
			<h2 class="mt-1 font-display text-4xl md:text-6xl font-semibold tracking-tight">
				From egg to <span class="italic text-primary">full-grown</span>
			</h2>
			<p class="mt-4 text-muted-foreground text-lg text-balance">
				Cuicuit has a plan. Here's where we're headed, and you can vote to change the direction.
			</p>
		</div>

		<ol class="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
			{#each roadmap as r, i (r.label)}
				<li
					class="relative rounded-2xl border border-border bg-card p-6 shadow-(--shadow-soft) hover:shadow-(--shadow-lift) hover:-translate-y-1 transition"
				>
					<span
						class={'absolute top-5 right-5 rounded-full px-2.5 py-1 text-[10px] font-semibold ' +
							(r.tone === 'active'
								? 'bg-amber-100 text-primary'
								: 'bg-muted/40 text-muted-foreground')}
					>
						{r.tone === 'active' ? '🚧 ' : ''}{r.state}
					</span>
					<div class="text-4xl leading-none">{r.emoji}</div>
					<div
						class="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
					>
						Step {i}
					</div>
					<div class="mt-1 font-display text-xl font-semibold leading-snug">
						{r.label}
					</div>
					<p class="mt-2 text-sm text-muted-foreground leading-relaxed">{r.note}</p>
					<ul class="mt-5 space-y-1.5 text-sm text-foreground/80">
						{#each r.items as item (item)}
							<li class="flex gap-2">
								<span class="text-primary">·</span>
								{item}
							</li>
						{/each}
					</ul>
				</li>
			{/each}
		</ol>

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

	<section id="pricing" class="relative mx-auto max-w-6xl px-6 mt-32 scroll-mt-24">
		<div class="text-center max-w-2xl mx-auto">
			<span class="font-hand text-2xl text-primary">pricing</span>
			<h2 class="mt-1 font-display text-4xl md:text-5xl font-semibold tracking-tight">
				Pick your <span class="italic">nest</span> 🪺
			</h2>
			<p class="mt-4 text-muted-foreground">
				Free forever if you self-host. A crowd-funded hosted version if you'd rather it just works.
			</p>
		</div>

		<!-- <div aria-hidden={true} class="hidden lg:block absolute right-16 top-24 rotate-[8deg] z-10">
			<span class="font-hand text-xl text-primary">psst — this one's free too!</span>
			<svg viewBox="0 0 120 80" class="w-24 h-16 text-primary/70 -mt-1 ml-8">
				<path
					d="M110 6 Q 60 20, 30 60 T 8 76"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				/>
				<path
					d="M16 68 L 8 76 L 20 78"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</div> -->

		<div class="mt-12 grid gap-6 md:grid-cols-3">
			<div
				class="rounded-3xl bg-neutral-950 text-neutral-100 p-8 shadow-(--shadow-soft) border border-neutral-900"
			>
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2 text-sm font-semibold text-white">
						<Terminal class="h-4 w-4" /> Self-hosted
					</div>
					<span
						class="rounded-full bg-green-950 text-green-500 px-2.5 py-1 text-[10px] font-semibold"
					>
						Free forever
					</span>
				</div>
				<p class="mt-4 text-sm text-neutral-400 leading-relaxed">
					Open-source, privacy-first, and yours to run. Dockerized deployment is on the way.
				</p>
				<pre
					class="mt-5 rounded-xl bg-neutral-900/70 border border-neutral-800 p-4 text-[12.5px] leading-relaxed font-mono text-neutral-200 overflow-x-clip">
<span class="text-neutral-500"># available soon</span>
<span class="text-primary">$</span> wget https://get.cuicuit.app
<span class="text-primary">$</span> chmod +x install.sh
<span class="text-primary">$</span> ./install.sh
<span class="text-primary">$</span> docker compose up -d
<span class="text-emerald-400">✓</span> <span class="text-neutral-400"
						>serving on localhost:3000</span
					></pre>
				<a
					href="https://github.com/MadeInPierre/cuicuit"
					target="_blank"
					rel="noreferrer"
					class="mt-9 inline-flex w-full items-center justify-center gap-2 rounded-full bg-neutral-800 text-neutral-100 px-5 py-3 text-sm font-semibold hover:bg-neutral-700 transition"
				>
					<Github class="h-4 w-4" /> Read the docs <ExternalLink class="size-4" />
				</a>
			</div>

			<div
				class="relative rounded-3xl border-2 border-pink-500 bg-card p-8 shadow-(--shadow-lift) md:-translate-y-3"
			>
				<span
					class="absolute w-max -top-3 left-1/2 -translate-x-1/2 rounded-full bg-pink-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground"
				>
					SUPPORT THE PROJECT
				</span>
				<div class="flex items-center gap-2 text-sm font-semibold text-pink-500">
					<Heart class="h-4 w-4" />
					Supporter
				</div>
				<div class="mt-4 font-display text-4xl font-semibold">Any amount</div>
				<p class="mt-1 text-sm text-muted-foreground">10 € = 100 seeds 🌱 ≈ 20 recipe imports.</p>
				<ul class="mt-6 space-y-3 text-sm">
					{#each ['Hosted with guaranteed features', 'Unused seeds go to free users', "Accelerate Cuicuit's development", 'A very warm thank-you 🩷'] as t (t)}
						<li class="flex items-start gap-2">
							<Check class="h-4 w-4 mt-0.5 text-pink-500 shrink-0" />
							{t}
						</li>
					{/each}
				</ul>
				<SupportDialog email={data.claims?.email || null}>
					<button
						class="mt-13 inline-flex w-full items-center justify-center gap-2 rounded-full bg-pink-500 px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
					>
						Join the moneypot <Heart class="h-4 w-4" fill="#ffffff" />
					</button>
				</SupportDialog>
			</div>

			<div class="rounded-3xl border border-border bg-card p-8 shadow-(--shadow-soft)">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2 text-sm font-semibold">
						<Sparkles class="h-4 w-4" /> Hosted
					</div>
					<a
						href="#experiment"
						class="rounded-full flex items-center gap-1 shrink-0 bg-muted/40 text-muted-foreground px-2.5 py-1 text-[10px] font-semibold"
					>
						Experiment <CircleQuestionMark class="size-2.5" />
					</a>
				</div>
				<div class="mt-4 font-display text-4xl font-semibold">
					Free
					<span class="text-base font-normal text-muted-foreground">
						as a 🐤
						<span class="sr-only">bird</span>
					</span>
				</div>
				<p class="mt-1 text-sm text-muted-foreground">No credit card. Start in one click.</p>
				<ul class="mt-6 space-y-3 text-sm">
					{#each ['All features included!', "Use the shared moneypot's seeds 🌱 for heavy features"] as t (t)}
						<li class="flex items-start gap-2">
							<Check class="h-4 w-4 mt-0.5 shrink-0" />
							{t}
						</li>
					{/each}

					<li class="flex items-start gap-2 text-amber-600">
						<TriangleAlert class="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
						Some features pause if not enough supporters fill the moneypot
					</li>
				</ul>
				<a
					href="/signup"
					class="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-5 py-3 text-sm font-semibold hover:bg-secondary transition"
				>
					Sign Up on Hosted <ArrowRight class="h-4 w-4" />
				</a>
			</div>
		</div>

		<div class="relative mt-6 max-w-5xl mx-auto">
			<div aria-hidden={true} class="flex flex-col items-center">
				<svg viewBox="0 0 40 72" class="w-6 h-14 text-primary/70">
					<path
						d="M20 4 L 20 56"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-dasharray="4 4"
					/>
					<path
						d="M12 48 L 20 58 L 28 48"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<span class="font-hand text-2xl text-primary">where your money goes</span>
			</div>

			<div class="grid p-6 md:p-8 pt-2 md:pt-2">
				<span class="text-right pr-2 mb-2 text-muted-foreground/60 text-sm sm:text-md font-hand">
					+ Your country's VAT
				</span>
				<div
					class="h-10 md:h-12 w-full rounded-full overflow-hidden flex drop-shadow-md border-4 border-white"
				>
					<div
						class="basis-30/100 flex items-center justify-center text-[10px] md:text-xs ftext-foreground bg-blue-300"
					>
						<div class="flex flex-col items-center">
							<span class="font-semibold">30%</span>
							<span>Yours</span>
						</div>
					</div>
					<div
						class="basis-15/100 flex items-center justify-center text-[10px] md:text-xs ftext-foreground bg-pink-300"
					>
						<div class="flex flex-col items-center">
							<span class="font-semibold">15%</span>
							<span>Shared</span>
						</div>
					</div>
					<div
						class="basis-15/100 flex items-center justify-center text-[10px] md:text-xs ftext-foreground bg-lime-300"
					>
						<div class="flex flex-col items-center">
							<span class="font-semibold">15%</span>
							<span class="hidden sm:inline-block">Development</span>
							<span class="inline-block sm:hidden">Dev.</span>
						</div>
					</div>
					<div
						class="basis-1/10 flex items-center justify-center text-[10px] md:text-xs text-foreground bg-gray-200 border-r-2 border-gray-300 border-dashed"
					>
						<div class="flex flex-col items-center">
							<span class="font-semibold">10%</span>
							<span>Fees</span>
						</div>
					</div>
					<div
						class="basis-3/10 flex items-center justify-center text-[10px] md:text-xs text-foreground bg-gray-200"
					>
						<div class="flex flex-col items-center">
							<span class="font-semibold">30%</span>
							<span>Gov. Taxes</span>
						</div>
					</div>
				</div>

				<div class="mt-6 grid gap-4 sm:grid-cols-4 text-sm">
					<div class="flex gap-3">
						<span class="mt-1 h-3 w-3 rounded-full bg-blue-300 shrink-0"></span>
						<div>
							<p class="font-semibold">Personal Pocket</p>
							<p class="text-muted-foreground text-xs leading-relaxed">
								Reserved for you to shield you from empty moneypot moments. Shared <br /> if unused,
								see details.
							</p>
						</div>
					</div>
					<div class="flex gap-3 pr-3">
						<span class="mt-1 h-3 w-3 rounded-full bg-pink-300 shrink-0"></span>
						<div>
							<p class="font-semibold">Community Moneypot</p>
							<p class="text-muted-foreground text-xs leading-relaxed">
								Used by free users &amp; supporters with fair limits. If very healthy, used to fuel
								development.
							</p>
						</div>
					</div>
					<div class="flex gap-3">
						<span class="mt-1 h-3 w-3 rounded-full bg-lime-300 shrink-0"></span>
						<div>
							<p class="font-semibold">Servers &amp; Salary</p>
							<p class="text-muted-foreground text-xs leading-relaxed">
								Fixed server bills and paid tools. Anything left becomes my salary <br /> to keep improving
								Cuicuit.
							</p>
						</div>
					</div>
					<div class="flex gap-3">
						<span class="mt-1 h-3 w-3 rounded-full bg-gray-300 shrink-0"></span>
						<div>
							<p class="font-semibold">Taxes & Fees</p>
							<p class="text-muted-foreground text-xs leading-relaxed">
								Cuicuit is seen as a regular software product by your & my countries. Payment fees
								add up on top.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<section id="faq" class="mx-auto max-w-4xl px-6 mt-32 scroll-mt-24">
		<div class="text-center max-w-2xl mx-auto">
			<span class="font-hand text-2xl text-primary">faq</span>
			<h2 class="mt-1 font-display text-4xl md:text-5xl font-semibold tracking-tight">
				Questions & <span class="italic text-primary">Answers</span>
			</h2>
			<p class="mt-4 text-muted-foreground">
				Everything you might wonder before you crack the first egg.
			</p>
		</div>

		<div class="mt-10 grid gap-3">
			{#each faqs as f (f.q)}
				<details
					id={f.id}
					class="group rounded-2xl border border-border bg-card p-6 shadow-(--shadow-soft) open:shadow-(--shadow-lift) transition"
				>
					<summary
						class="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold"
					>
						{f.q}
						<span
							class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition group-open:rotate-45"
						>
							+
						</span>
					</summary>
					<p class="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
				</details>
			{/each}
		</div>
	</section>

	<section id="story" class="mx-auto max-w-6xl px-6 mt-32 scroll-mt-24">
		<div class="relative p-8 md:p-14">
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

				<!-- <div aria-hidden={true} class="hidden lg:block absolute left-8 top-12 rotate-[-6deg]">
					<span class="font-hand text-xl text-primary/60">← the real reason</span>
					<svg viewBox="0 0 100 60" class="w-20 h-12 text-primary/70 ml-12 -mt-1">
						<path
							d="M96 8 Q 60 12, 40 40 T 12 54"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
						<path
							d="M20 46 L 12 54 L 24 56"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</div> -->

				<div class="mt-10 text-left md:text-lg text-foreground/90 leading-relaxed space-y-5">
					<p>
						Hi! I’m Pierre, the human behind this little egg 😊. Cuicuit started as a selfish
						project: I love cooking, but I hate the 6pm panic of <em
							>“what’s for dinner, and what do we even have in the fridge?”</em
						>
					</p>
					<p>
						I wanted a kitchen companion that felt <span
							class="relative inline-block font-semibold text-primary"
						>
							warm and helpful
							<svg
								aria-hidden={true}
								viewBox="0 0 180 20"
								preserveAspectRatio="none"
								class="absolute -bottom-1 left-0 w-full h-3 text-primary/70"
							>
								<path
									d="M4 10 Q 50 18, 100 10 T 176 12"
									fill="none"
									stroke="currentColor"
									stroke-width="3"
									stroke-linecap="round"
								/>
							</svg>
						</span> — not like another chore app yelling at me from a spreadsheet. So I started building
						Cuicuit in the open, one recipe at a time.
					</p>
					<p>
						To me, the best tools are made
						<span class="font-semibold"> with people, not in secret. </span>
						That’s why Cuicuit is open-source, why the roadmap is public with voting, and why the hosted
						version is free — supported by a community moneypot instead of ads or data selling.
					</p>
					<p>
						If you find it useful, a star on GitHub, a bug report, or a small contribution to the
						moneypot keeps the project growing. Every bit of support means more time I can spend
						making Cuicuit the happiest little kitchen app on the internet.
					</p>
				</div>

				<div class="mt-10 flex flex-wrap items-center justify-center gap-4">
					<a
						href="https://github.com/MadeInPierre/cuicuit"
						target="_blank"
						rel="noreferrer"
						class="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-(--shadow-lift) hover:-translate-y-0.5 transition"
					>
						<Github class="h-4 w-4" /> Star on GitHub
					</a>
					<a
						href="#pricing"
						class="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold hover:bg-secondary transition"
					>
						Support the moneypot <Heart class="h-4 w-4 text-primary" />
					</a>
				</div>

				<p class="mt-6 text-sm text-muted-foreground italic">
					Thank you for being here. 🐣 — Pierre
				</p>
			</div>

			<!-- <div aria-hidden={true} class="hidden lg:block absolute right-10 bottom-16 rotate-[10deg]">
				<span class="font-hand text-xl text-primary/60">made with love (and hunger)</span>
				<svg viewBox="0 0 120 60" class="w-24 h-12 text-primary/70 -mt-2 ml-2">
					<path
						d="M4 8 Q 50 4, 90 30 T 116 52"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
					<path
						d="M108 44 L 116 52 L 104 54"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</div> -->
		</div>
	</section>

	<section class="mx-auto max-w-6xl px-6 mt-32">
		<div
			class="relative overflow-hidden rounded-3xl bg-primary p-12 md:p-16 text-center shadow-(--shadow-lift)"
		>
			<div
				aria-hidden={true}
				class="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_60%,white,transparent_35%)]"
			></div>
			<div class="relative text-white">
				<h2 class="font-display text-4xl md:text-5xl font-semibold tracking-tight text-white">
					C'est cuicuit. <span class="italic text-white/90">Dinner's sorted.</span>
				</h2>
				<p class="mx-auto mt-4 max-w-xl text-white/90">
					Give the little chick a try. Import your first recipe in under a minute.
				</p>
				<div class="mt-8 flex flex-wrap justify-center gap-3">
					<a
						href="/signup"
						class="inline-flex items-center gap-2 rounded-full bg-background text-foreground px-6 py-3 text-sm font-semibold hover:-translate-y-0.5 transition"
					>
						Start cooking free <ArrowRight class="h-4 w-4" />
					</a>
					<a
						href="https://github.com/MadeInPierre/cuicuit"
						target="_blank"
						rel="noreferrer"
						class="inline-flex items-center gap-2 rounded-full border border-white/50 text-white px-6 py-3 text-sm font-semibold hover:bg-white/10 transition"
					>
						<Github class="h-4 w-4" /> Self-host it
					</a>
				</div>
			</div>
		</div>
	</section>

	<footer class="mx-auto max-w-6xl px-6 mt-24 pb-12">
		<div
			class="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-border pt-8 text-sm text-foreground/70"
		>
			<div class="flex items-center justify-center gap-2 font-medium">
				<img src="/cuicuit_logo_transparent.png" alt="Cuicuit" class="h-6" />
				<span>Cuicuit</span>
			</div>
			<p>
				Made with <Heart class="inline h-3.5 w-3.5 text-primary" /> and a lot of eggs. Open source under
				a friendly roof.
			</p>
			<a
				href="https://github.com/MadeInPierre/cuicuit"
				target="_blank"
				rel="noreferrer"
				class="inline-flex items-center gap-1.5 hover:text-foreground"
			>
				<Github class="h-4 w-4" /> GitHub
			</a>
		</div>
	</footer>
</div>

<style module>
	:global(html) {
		scroll-behavior: smooth;
	}
</style>
