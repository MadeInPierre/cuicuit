<script lang="ts">
	import { Check, TriangleAlert } from '@lucide/svelte';
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

	const faqs = [
		{
			q: 'What is Cuicuit?',
			a: "Cuicuit is an open-source meal planning app that imports recipes from any website, helps you plan your week, and automatically builds an aisle-aware shopping list. More features like pantry-aware meal recommendations coming soon. It's free to self-host and offers a free hosted version."
		},
		{
			q: 'Is Cuicuit really free?',
			a: "Yes, and I hope forever! The full source code is on GitHub under a permissive license and you can self-host it forever at no cost. Our hosted cloud version also has an unlimited free plan, funded by a community moneypot. This free plan is an experiment, I hope to see enough supporters to keep the app free for everyone. If the free version freezes too often, I might have to go back to a regular 'freemium' model — self-host your own instance if needed."
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
			a: "Cuicuit is a Progressive Web App (PWA). Install it from your phone's browser and take your shopping list to the store — no app store required. Offline support coming soon."
		},
		{
			q: 'Can my family or roommates share a meal plan with me?',
			a: 'Absolutely. Shared households let multiple people cook, plan, and shop together in the same synced space.'
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
			title: 'Pocket-ready PWA',
			body: 'Install Cuicuit on your phone and take your list to the store — no app store detour.'
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
</script>

<div class="min-h-screen bg-background text-foreground font-sans antialiased" id="landing-root">
	<header class="sticky top-0 z-30 backdrop-blur-md bg-background/70 border-b border-border/60">
		<div class="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
			<a href="#top" class="flex items-center gap-1 text-xl font-semibold tracking-tight">
				<!-- <span
					class="grid place-items-center h-8 w-8 rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
				>
					<Egg class="h-4 w-4" />
				</span>
				Cuicuit -->

				<div class="mx-auto flex items-center justify-center gap-2">
					<img src="/cuicuit_logo_transparent.png" alt="Cuicuit" class="h-8" />
					<h1>Cuicuit</h1>
				</div>

				<!-- <span
					class="ml-1 rounded-full bg-[var(--yolk)]/40 px-2 py-0.5 text-[10px] font-sans font-semibold uppercase tracking-wider text-foreground/70"
				>
					alpha
				</span> -->

				<!-- <span class="px-2 text-xl text-primary font-hand font-normal"> alpha </span> -->

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
			<a
				href="#pricing"
				class="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] hover:opacity-90 transition"
			>
				Get Started <ArrowRight class="h-3.5 w-3.5" />
			</a>
		</div>
	</header>

	<section id="top" class="relative overflow-hidden bg-[var(--gradient-warm)]">
		<div
			aria-hidden={true}
			class="pointer-events-none absolute -top-40 -right-40 h-[720px] w-[720px] rounded-full bg-primary/5 sm:bg-primary/10 md:bg-primary/15 blur-[120px]"
		></div>
		<div
			aria-hidden={true}
			class="pointer-events-none absolute top-60 -left-56 h-[640px] w-[640px] rounded-full bg-primary/5 sm:bg-primary/10 blur-[130px]"
		></div>
		<div
			aria-hidden={true}
			class="pointer-events-none absolute -bottom-40 left-1/3 h-[520px] w-[520px] rounded-full bg-[var(--clay)]/15 blur-[110px]"
		></div>

		<div class="relative mx-auto max-w-6xl px-6 pt-20 pb-8 text-center">
			<span
				class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/70 backdrop-blur px-4 py-0.5 font-hand text-xl text-primary shadow-[var(--shadow-soft)]"
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
						class="absolute -bottom-3 left-0 w-full h-3 text-primary/80"
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
					class="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)] hover:-translate-y-0.5 transition"
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
					<span class="font-hand text-2xl text-primary/80">sneak peek</span>
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
					class="relative rounded-2xl border border-border bg-card p-2 shadow-[var(--shadow-lift)]"
				>
					<img
						src="/hero/hero_wide.png"
						alt="Screenshot of the Cuicuit app showing planned meals, recipe gallery, and shopping list."
						class="w-full rounded-xl"
						loading="eager"
					/>
				</div>
			</div>
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
						class="relative rounded-2xl bg-sidebar p-7 hover:-translate-y-1 hover:shadow-[var(--shadow-soft)] transition group"
					>
						<div
							class="grid place-items-center h-14 w-14 rounded-2xl bg-primary/10 group-hover:bg-primary text-primary group-hover:text-white transition-colors"
						>
							<Icon class="h-6 w-6" />
						</div>
						<div class="mt-6 font-hand text-3xl text-primary/70 leading-none">{step}</div>
						<h3 class="mt-1 font-display text-xl font-semibold">{title}</h3>
						<p class="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
					</div>
					{#if i < 2}
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
								d="M66 14 L 74 22 L 64 28"
								fill="none"
								stroke="currentColor"
								stroke-width="3"
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

			<div aria-hidden={true} class="hidden lg:block absolute -right-8 -top-6 rotate-[6deg]">
				<span class="font-hand text-xl text-primary/70">← our favorites</span>
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
					class="group rounded-xl bg-card p-6 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] hover:-translate-y-1 transition"
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
					class="relative rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] hover:-translate-y-1 transition"
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
				class="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold shadow-[var(--shadow-soft)] hover:bg-secondary transition"
			>
				📦 Vote for features on GitHub <ArrowRight class="h-4 w-4" />
			</a>
		</div>
	</section>

	<section id="pricing" class="relative mx-auto max-w-6xl px-6 mt-32 scroll-mt-24">
		<div class="text-center max-w-2xl mx-auto">
			<span class="font-hand text-2xl text-primary">pricing</span>
			<h2 class="mt-1 font-display text-4xl md:text-5xl font-semibold tracking-tight">
				Pick your <span class="italic">nest</span>.
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
				class="rounded-3xl bg-neutral-950 text-neutral-100 p-8 shadow-[var(--shadow-soft)] border border-neutral-900"
			>
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2 text-sm font-semibold text-white">
						<Terminal class="h-4 w-4" /> Self-hosted
					</div>
					<span
						class="rounded-full bg-neutral-800 text-neutral-200 px-2.5 py-1 text-[10px] font-semibold"
					>
						Free forever
					</span>
				</div>
				<p class="mt-4 text-sm text-neutral-400 leading-relaxed">
					Open-source, privacy-first, and yours to run. Dockerized deployment is on the way.
				</p>
				<pre
					class="mt-5 rounded-xl bg-neutral-900/70 border border-neutral-800 p-4 text-[12.5px] leading-relaxed font-mono text-neutral-200 overflow-x-hidden">
<span class="text-neutral-500"># available soon</span>
<span class="text-primary">$</span> curl -fsSL https://get.cuicuit.app | sudo bash
<span class="text-primary">$</span> chmod +x install.sh && ./install.sh
<span class="text-primary">$</span> docker compose up -d
<span class="text-emerald-400">✓</span> <span class="text-neutral-400"
						>serving on localhost:3000</span
					></pre>
				<a
					href="https://github.com/MadeInPierre/cuicuit"
					target="_blank"
					rel="noreferrer"
					class="mt-13 inline-flex w-full items-center justify-center gap-2 rounded-full bg-neutral-800 text-neutral-100 px-5 py-3 text-sm font-semibold hover:bg-neutral-700 transition"
				>
					<Github class="h-4 w-4" /> View on GitHub
				</a>
			</div>

			<div
				class="relative rounded-3xl border-2 border-pink-500 bg-card p-8 shadow-[var(--shadow-lift)] md:-translate-y-3"
			>
				<span
					class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-pink-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground"
				>
					SUPPORT THE PROJECT
				</span>
				<div class="flex items-center gap-2 text-sm font-semibold text-pink-500">
					<Heart class="h-4 w-4" />
					Supporter
				</div>
				<div class="mt-4 font-display text-4xl font-semibold">Any amount</div>
				<p class="mt-1 text-sm text-muted-foreground">Crowd-funded moneypot. Fuel the flock.</p>
				<ul class="mt-6 space-y-3 text-sm">
					{#each ['Everything in Hosted plus:', 'Unused amount goes to free users', "Accelerate Cuicuit's development", 'A very warm thank-you 🩷'] as t (t)}
						<li class="flex items-start gap-2">
							<Check class="h-4 w-4 mt-0.5 text-pink-500 shrink-0" />
							{t}
						</li>
					{/each}
				</ul>
				<a
					href="https://github.com/sponsors/MadeInPierre"
					target="_blank"
					class="mt-13 inline-flex w-full items-center justify-center gap-2 rounded-full bg-pink-500 px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
				>
					Join the moneypot <Heart class="h-4 w-4" fill="#ffffff" />
				</a>
			</div>

			<div class="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
				<div class="flex items-center gap-2 text-sm font-semibold">
					<Sparkles class="h-4 w-4" /> Hosted · Free
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
					{#each ['Shared household spaces', 'Recipe imports from the web', 'Auto-generated shopping lists'] as t (t)}
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
					class="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold hover:bg-secondary transition"
				>
					Start cooking on Hosted <ArrowRight class="h-4 w-4" />
				</a>
			</div>
		</div>

		<!-- <div class="mt-12 flex flex-row gap-6">
			<div
				class="basis-1/3 rounded-2xl bg-neutral-950 text-neutral-100 p-8 drop-shadow-md border border-neutral-900"
			>
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2 text-sm font-semibold text-white">
						<Terminal class="h-4 w-4" /> Self-hosted
					</div>
					<span
						class="rounded-full bg-neutral-800 text-neutral-200 px-2.5 py-1 text-[10px] font-semibold"
					>
						Free forever
					</span>
				</div>
				<p class="mt-4 text-sm text-neutral-400 leading-relaxed">
					Open-source, privacy-first, and yours to run. Dockerized deployment is on the way.
				</p>
				<pre
					class="mt-5 rounded-xl bg-neutral-900/70 border border-neutral-800 p-4 text-[12.5px] leading-relaxed font-mono text-neutral-200 overflow-x-hidden">
<span class="text-neutral-500"># clone &amp; run</span>
<span class="text-primary">$</span> curl -fsSL https://get.cuicuit.app | sudo bash
<span class="text-primary">$</span> chmod +x install.sh && ./install.sh
<span class="text-primary">$</span> docker compose up -d
<span class="text-emerald-400">✓</span> <span class="text-neutral-400"
						>serving on localhost:3000</span
					></pre>
				<a
					href="https://github.com/MadeInPierre/cuicuit"
					target="_blank"
					rel="noreferrer"
					class="mt-11 inline-flex w-full items-center justify-center gap-2 rounded-full bg-neutral-800 text-neutral-100 px-5 py-3 text-sm font-semibold hover:bg-neutral-700 transition"
				>
					<Github class="h-4 w-4" /> View on GitHub
				</a>
			</div>

			<div class="basis-2/3 rounded-2xl border border-border bg-card p-8 drop-shadow-md flex gap-4">
				<div class="basis-1/2">
					<div class="flex items-center gap-2 text-sm font-semibold">
						<Sparkles class="h-4 w-4" /> Hosted · Free
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
						{#each ['Shared household spaces', 'Recipe imports from the web', 'Auto-generated shopping lists'] as t (t)}
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
						class="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold hover:bg-secondary transition"
					>
						Start free <ArrowRight class="h-4 w-4" />
					</a>
				</div>

				<SeparatorZigZag direction="vertical" color="#f6339a" />

				<div class="basis-1/2">
					<div class="flex items-center gap-2 text-sm font-semibold text-pink-500">
						<Heart class="h-4 w-4" />
						Supporter
					</div>
					<div class="mt-4 font-display text-4xl font-semibold">Any amount</div>
					<p class="mt-1 text-sm text-muted-foreground">Crowd-funded moneypot. Fuel the flock.</p>
					<ul class="mt-6 space-y-3 text-sm">
						{#each ['Everything in Hosted plus:', 'Unused amount goes to free users', "Accelerate Cuicuit's development", 'A very warm thank-you 🩷'] as t (t)}
							<li class="flex items-start gap-2">
								<Check class="h-4 w-4 mt-0.5 text-pink-500 shrink-0" />
								{t}
							</li>
						{/each}
					</ul>
					<a
						href="https://github.com/sponsors/MadeInPierre"
						target="_blank"
						class="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full bg-pink-500 px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
					>
						Join the moneypot <Heart class="h-4 w-4" fill="#ffffff" />
					</a>
				</div>
			</div>
		</div> -->
	</section>

	<section id="faq" class="mx-auto max-w-4xl px-6 mt-32 scroll-mt-24">
		<div class="text-center max-w-2xl mx-auto">
			<span class="font-hand text-2xl text-primary">faq</span>
			<h2 class="mt-1 font-display text-4xl md:text-5xl font-semibold tracking-tight">
				Questions, <span class="italic text-primary">answered</span>.
			</h2>
			<p class="mt-4 text-muted-foreground">
				Everything you might wonder before you crack the first egg.
			</p>
		</div>

		<div class="mt-10 grid gap-3">
			{#each faqs as f (f.q)}
				<details
					class="group rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] open:shadow-[var(--shadow-lift)] transition"
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
							class="absolute -bottom-1 left-0 w-full h-3 text-primary/80"
						>
							<path
								d="M4 12 Q 50 4, 100 10 T 196 8"
								fill="none"
								stroke="currentColor"
								stroke-width="3"
								stroke-linecap="round"
							/>
						</svg>
					</span>
				</h2>

				<!-- <div aria-hidden={true} class="hidden lg:block absolute left-8 top-12 rotate-[-6deg]">
					<span class="font-hand text-xl text-primary/80">← the real reason</span>
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
						class="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)] hover:-translate-y-0.5 transition"
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
				<span class="font-hand text-xl text-primary/80">made with love (and hunger)</span>
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
			class="relative overflow-hidden rounded-3xl bg-primary p-12 md:p-16 text-center shadow-[var(--shadow-lift)]"
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
