<script lang="ts">
	import { goto } from '$app/navigation';
	import ThemeButton from '$lib/shared/components/ThemeButton.svelte';
	import Button from '$lib/shared/components/ui/button/button.svelte';
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';
	import {
		Camera,
		Check,
		ChevronDown,
		CircleQuestionMark,
		ExternalLink,
		Globe,
		Share,
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
	import SupportWallAutoDialog from './supporter/success/SupportWallAutoDialog.svelte';
	import SeparatorZigZag from '../(app)/shopping-list/SeparatorZigZag.svelte';
	import GlassScreenshots from './GlassScreenshots.svelte';

	const { data } = $props();

	const howToSteps = [
		{
			icon: BookOpen,
			step: '01',
			title: 'Paste a recipe link',
			body: 'From any food blog. We parse ingredients, steps, timings and guessed filters.',
			image: '' // 'hero/howto_step1.png'
		},
		{
			icon: CalendarDays,
			step: '02',
			title: 'Drop it in your plan',
			body: 'Drag meals into a flexible plan. Scale servings, tweak, or swap ingredients easily.'
		},
		{
			icon: ShoppingBasket,
			step: '03',
			title: 'Just go shopping!',
			body: 'An aisle-aware list appears. Check things off as you cruise the store.'
		}
	];

	const features = [
		{
			icon: BookOpen,
			title: 'Import from anywhere',
			body: 'Paste a link from your food blog, Cuicuit pulls the recipe and guesses convenient filters.'
		},
		{
			icon: ShoppingBasket,
			title: 'Groceries from Plan',
			body: 'Your plan turns into an aisle-aware grocery list, with smart suggestions from past purchases.'
		},
		{
			icon: Share,
			title: 'Export, Share & Connect',
			body: 'Cuicuit aims to provide open connectors like a REST API, AI MCP, and file exporting. Soon!'
		},
		{
			icon: Users,
			title: 'Shared households',
			body: 'Cook together. Invite family or roommates into shared spaces that stay in sync.'
		},
		{
			icon: Smartphone,
			title: 'Mobile-friendly',
			body: 'Install Cuicuit on your phone as a PWA and take your list to the store. No app store (yet).'
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
			label: 'Open Foundations',
			note: 'Project setup, hosted version, basic multi-user support.',
			items: ['Publicly hosted version', 'Docker deployment', 'Self-hosted docs', 'Many bugfixes'],
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
			label: 'Pantry-Aware',
			note: "Track what's in your fridge and get smarter suggestions.",
			items: [
				'Pantry management',
				'Recipe "cookability"',
				'Expiration & Easy imports',
				'Ingredient substitutions'
			],
			state: 'Planned',
			tone: 'soon'
		},
		{
			emoji: '🐓',
			label: 'Habits & Smartness',
			note: 'The app learns your patterns and saves you even more time.',
			items: ['Consumption habits', 'Smart recommendations', 'Timeline & stats', 'LLM assistant'],
			state: 'Planned',
			tone: 'soon'
		}
	];

	const FUTURE_IDEA_PREVIEW_COUNT = 3;
	const DISCUSSION_SEARCH_BASE =
		'https://github.com/MadeInPierre/cuicuit/discussions?discussions_q=';

	const toFeatureDiscussion = (feature: string) =>
		`${DISCUSSION_SEARCH_BASE}${encodeURIComponent(`is:open category:ideas ${feature}`)}`;

	const futureIdeaDomains = [
		{
			key: 'recipes',
			label: 'Recipes',
			ideas: [
				{ label: 'Custom recipe filters', href: toFeatureDiscussion('Custom recipe filters') },
				{
					label: 'Semantic recipe grouping',
					href: toFeatureDiscussion('Semantic recipe grouping')
				},
				{
					label: 'Scale by nutrition target',
					href: toFeatureDiscussion('Scale by nutrition target')
				},
				{
					label: 'Ingredient substitutions',
					href: toFeatureDiscussion('Ingredient substitutions')
				},
				{ label: 'Allergen & preferences', href: toFeatureDiscussion('Allergen preferences') },
				{ label: 'Hands-free cook mode', href: toFeatureDiscussion('Hands-free cook mode') },
				{
					label: 'Recipe difficulty scoring',
					href: toFeatureDiscussion('Recipe difficulty scoring')
				},
				{
					label: 'Auto timing parallelizer',
					href: toFeatureDiscussion('Auto timing parallelizer')
				},
				{
					label: 'AI suggestions from leftovers',
					href: toFeatureDiscussion('AI suggestions from leftovers')
				}
			]
		},
		{
			key: 'pantry',
			label: 'Pantry & Shopping',
			ideas: [
				{
					label: 'Shop mode: product decision help',
					href: toFeatureDiscussion('Shop mode product decision help')
				},
				{
					label: 'Barcode & receipt scan to pantry',
					href: toFeatureDiscussion('Barcode receipt scan pantry')
				},
				{
					label: 'Habit-based sugestions',
					href: toFeatureDiscussion('Habits suggestions')
				},
				{ label: 'Expiration heatmap', href: toFeatureDiscussion('Expiration heatmap') },
				{ label: 'Fridge photo to pantry', href: toFeatureDiscussion('Fridge photo to pantry') },
				{ label: 'Waste-risk alerts', href: toFeatureDiscussion('Waste-risk alerts') },
				{
					label: 'Aisle reorder by store',
					href: toFeatureDiscussion('Aisle reorder by store')
				},
				{ label: 'Bulk buy suggestions', href: toFeatureDiscussion('Bulk buy suggestions') },
				{
					label: 'Pantry confidence score',
					href: toFeatureDiscussion('Pantry confidence score')
				}
			]
		},
		{
			key: 'planning',
			label: 'Planning & Household',
			ideas: [
				{
					label: 'Weekly auto-plan generator',
					href: toFeatureDiscussion('Weekly auto-plan generator')
				},
				{ label: 'Kid-friendly meal lane', href: toFeatureDiscussion('Kid-friendly meal lane') },
				{
					label: 'Weekly goals - budget, nutrition',
					href: toFeatureDiscussion('Weekly goals budget nutrition')
				},
				{
					label: 'Calendar planner with habits',
					href: toFeatureDiscussion('Calendar planner with habits')
				},
				{
					label: 'Veggies seasonal indicator',
					href: toFeatureDiscussion('Veggies seasonal indicator')
				},
				{
					label: 'Meal logging and history',
					href: toFeatureDiscussion('Meal logging and history')
				}
			]
		},
		{
			key: 'integrations',
			label: 'Integrations',
			ideas: [
				{ label: 'Public REST API', href: toFeatureDiscussion('REST API') },
				{
					label: 'MCP server & A2A for agents',
					href: toFeatureDiscussion('MCP server A2A agents')
				},
				{ label: 'CLI for power users', href: toFeatureDiscussion('CLI') },
				{ label: 'Gemini & Siri', href: toFeatureDiscussion('Gemini Siri') },
				{ label: 'AI sidebar in-app', href: toFeatureDiscussion('AI sidebar') },
				{ label: 'Webhook automations', href: toFeatureDiscussion('Webhook') },
				{
					label: 'Zapier/n8n connectors',
					href: toFeatureDiscussion('Zapier n8n connectors')
				},
				{
					label: 'Sync with Notion and Obsidian',
					href: toFeatureDiscussion('Sync with Notion and Obsidian')
				}
			]
		},
		{
			key: 'mobile',
			label: 'Mobile & Offline',
			ideas: [
				{
					label: 'Offline shopping mode',
					href: toFeatureDiscussion('Offline shopping mode')
				},
				{
					label: 'Voice rambling interaction',
					href: toFeatureDiscussion('Voice rambling')
				},
				{
					label: 'Wearable shopping companion',
					href: toFeatureDiscussion('Wearable shopping companion')
				},
				{
					label: 'Camera-led pantry updates',
					href: toFeatureDiscussion('Camera-led pantry updates')
				},
				{
					label: 'Mobile notifications & reminders',
					href: toFeatureDiscussion('Mobile notifications reminders')
				}
			]
		},
		{
			key: 'insights',
			label: 'Insights & Automation',
			ideas: [
				{
					label: 'Nutrition & habit trends dashboard',
					href: toFeatureDiscussion('Nutrition habit trends dashboard')
				},
				{
					label: 'Carbon footprint estimates',
					href: toFeatureDiscussion('Carbon footprint estimates')
				},
				{
					label: 'Habit nudges and reminders',
					href: toFeatureDiscussion('Habit nudges and reminders')
				},
				{ label: 'Meal plan quality score', href: toFeatureDiscussion('Meal plan quality score') },
				{ label: 'Auto reorder assistant', href: toFeatureDiscussion('Auto reorder assistant') },
				{
					label: 'Personalized weekly goals',
					href: toFeatureDiscussion('Personalized weekly goals')
				},
				{
					label: 'Adaptive recommendation engine',
					href: toFeatureDiscussion('Adaptive recommendation engine')
				},
				{ label: 'Cost per meal analytics', href: toFeatureDiscussion('Cost per meal analytics') },
				{ label: 'Open data export packs', href: toFeatureDiscussion('Open data export packs') }
			]
		}
	];

	let expandedIdeaDomains = $state({} as Record<string, boolean>);

	function toggleIdeaDomain(domainKey: string) {
		expandedIdeaDomains[domainKey] = !expandedIdeaDomains[domainKey];
	}

	const faqs = [
		{
			q: 'What is Cuicuit?',
			a: "Cuicuit is an open-source meal planning app that imports recipes from any website, helps you plan your week, and automatically builds an aisle-aware shopping list. More features like pantry-aware meal recommendations coming soon. It's free to self-host and offers a free hosted version.",
			id: 'experiment'
		},
		{
			q: 'Is Cuicuit really free?',
			a: "Yes, and I hope forever! The full code is open source on GitHub and you can self-host it forever at no cost. The hosted cloud version also has an unlimited free plan, funded by a community moneypot. This free plan is an experiment, I hope to see enough supporters to keep the app free for everyone. If the free version freezes too often, I might have to go back to a regular 'freemium' model — self-host your own instance or support the project."
		},
		{
			q: 'How does recipe import work?',
			a: 'Paste any recipe URL — food blog, magazine, or personal site — and Cuicuit parses the ingredients, quantities, steps, and timings using open web standards like schema.org/Recipe. Behind the scenes, it then uses AI to add filters, ingredient substitutions, and more!'
		},
		{
			q: 'Can I self-host Cuicuit with Docker?',
			a: "Yes. Cuicuit ships with a docker-compose setup. Clone the repo, run 'docker compose up -d', and you'll have your own instance running in minutes. Your recipes and data stay on your hardware."
		},
		{
			q: 'Where does the name Cuicuit come from?',
			a: "Cuicuit is a play on words. In French, 'cui-cui' is the sound a bird makes, and 'cuit' means cooked. 'C'est cuit' is a French expression meaning 'it's cooked', so now we can say 'C'est cuicuit'!"
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

<section id="top" class="relative overflow-hidden bg-(--gradient-warm)">
	<div
		aria-hidden={true}
		class="pointer-events-none absolute -top-40 -right-40 h-180 w-180 rounded-full bg-primary/5 lg:bg-primary/10 blur-[120px]"
	></div>
	<div
		aria-hidden={true}
		class="pointer-events-none absolute top-60 -left-56 h-160 w-160 rounded-full bg-primary/5 sm:bg-primary/5 blur-[130px]"
	></div>
	<div
		aria-hidden={true}
		class="pointer-events-none absolute -bottom-40 left-1/3 h-130 w-130 rounded-full bg-(--clay)/15 blur-[110px]"
	></div>

	<div class="relative mx-auto max-w-6xl px-6 pt-20 pb-8 text-center">
		<span
			class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/70 backdrop-blur px-4 py-0.5 font-hand text-xl text-primary shadow-(--shadow-soft)"
		>
			🐥 Your favorite kitchen companion!
		</span>
		<h1
			class="mt-8 font-hand text-6xl sm:text-7xl md:text-8xl font-semibold leading-[0.9] tracking-tight text-balance"
		>
			<span class="relative inline-block xl:text-primary">
				Think about meals,
				<svg
					aria-hidden={true}
					viewBox="0 0 600 24"
					preserveAspectRatio="none"
					class="absolute -bottom-3 left-0 w-full h-3 text-primary/60 hidden xl:block"
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
			<br class="xl:hidden" />
			not ingredients.
		</h1>
		<p class="mx-auto mt-8 px-6 max-w-xl text-lg text-muted-foreground text-balance">
			Simply jot down meal ideas & things you're missing, and get a ready-to-shop list.
		</p>
		<p class="mt-3 text-xs italic text-muted-foreground">
			Open-source · Self-hostable · Hosted version
		</p>

		<div class="mt-12 flex flex-wrap justify-center gap-3">
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

		<div class="relative mt-16 mx-auto max-w-5xl">
			<!-- <div aria-hidden={true} class="hidden md:block absolute -left-6 -top-12 rotate-[-8deg] z-10">
				<span class="font-hand text-2xl text-primary/70">sneak peek</span>
				<svg viewBox="0 0 120 60" class="w-24 h-12 text-primary/70 ml-16 -mt-1">
					<path
						d="M6 10 C 36 2, 76 12, 106 42"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						d="M96 40 L 106 42 L 102 52"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</div> -->
			<div
				aria-hidden={true}
				class="absolute inset-x-10 -bottom-6 h-16 rounded-full bg-primary/25 blur-2xl"
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
			Three little steps, <span class="italic">zero headaches</span>.
		</h2>
	</div>
	<div class="relative mt-14 grid gap-6 md:grid-cols-3">
		{#each howToSteps as { icon: Icon, step, title, body, image }, i (step)}
			<div class="relative">
				<div
					class="relative rounded-xl md:rounded-2xl bg-sidebar p-4 md:p-7 hover:-translate-y-1 hover:shadow-(--shadow-soft) transition group"
				>
					<!-- {#if image}
						<img src={image} class="aspect-square w-60 mx-auto" alt="Step 1" />
					{:else}
						<div
							class="hidden md:grid mb-6 place-items-center h-14 w-14 rounded-2xl bg-primary/10 group-hover:bg-primary text-primary group-hover:text-white transition-colors"
						>
							<Icon class="h-6 w-6" />
						</div>
					{/if} -->

					<div class="flex items-center space-x-4 md:grid">
						<div class="font-hand text-4xl text-primary/70 leading-none">{step}</div>
						<h3 class="mt-1 font-display text-xl font-semibold">{title}</h3>
						<div
							class="md:hidden ml-auto grid place-items-center size-10 md:size-14 rounded-lg bg-primary/10 group-hover:bg-primary text-primary group-hover:text-white transition-colors"
						>
							<Icon class="h-6 w-6" />
						</div>
					</div>
					<p class="mt-2 mr-8 sm:mr-0 text-sm text-muted-foreground leading-relaxed">{body}</p>
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
			<span class="font-hand text-xl text-primary/70">Cuicuit's values</span>
		</div>
		<h2 class="mt-2 font-display text-4xl md:text-5xl font-semibold tracking-tight">
			Small app, <span class="italic">big appetite</span>.
		</h2>
		<p class="mt-4 text-muted-foreground text-lg">
			Cuicuit stays out of your way and does the boring parts, so cooking feels fun again.
		</p>
	</div>

	<div class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
		{#each features as { icon: Icon, title, body }, i (title)}
			<article
				class={`group relative isolate overflow-hidden rounded-2xl bg-card p-4 md:p-6 shadow-(--shadow-soft) hover:shadow-(--shadow-lift) origin-[50%_100%] transition-all duration-300 hover:-translate-y-1.5 ${i % 2 === 0 ? 'rotate-[-0.45deg] hover:rotate-0' : 'rotate-[0.45deg] hover:rotate-0'}`}
			>
				<div
					aria-hidden={true}
					class="absolute -top-1 left-6 h-3 w-12 rotate-[-8deg] rounded-sm border border-border/60 bg-background/75 opacity-70"
				></div>
				<div
					aria-hidden={true}
					class="absolute -top-1 right-8 h-3 w-10 rotate-[8deg] rounded-sm border border-border/60 bg-background/70 opacity-60"
				></div>

				<div
					class="grid place-items-center h-12 w-12 rounded-[34%_66%_58%_42%/44%_40%_60%_56%] bg-primary/12 text-primary transition-all duration-300 group-hover:rounded-xl group-hover:bg-primary group-hover:text-primary-foreground"
				>
					<Icon class="h-5 w-5" />
				</div>
				<h3 class="mt-6 font-display text-xl font-semibold">{title}</h3>
				<p class="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>

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
		<span class="font-hand text-2xl text-primary">🗺️ roadmap</span>
		<h2 class="mt-1 font-display text-4xl md:text-6xl font-semibold tracking-tight">
			From egg to <span class="italic text-primary">full-grown</span>
		</h2>
		<p class="mt-4 mx-auto max-w-2xl text-muted-foreground text-lg text-balance">
			Cuicuit has a plan. Here's where we're headed, and you can vote to change the direction.
		</p>
	</div>

	<div class="mt-14">
		<ol class="grid gap-[1.35rem] lg:grid-cols-4 lg:gap-5">
			{#each roadmap as r, i (r.label)}
				<li class="relative lg:even:mt-8">
					<article
						class={`relative rounded-2xl bg-card p-6 shadow-(--shadow-soft) transition-all duration-200 hover:-translate-y-1 hover:shadow-(--shadow-lift) after:pointer-events-none after:absolute after:right-[1.1rem] after:bottom-[0.7rem] after:h-3 after:w-[4.4rem] after:opacity-40 after:content-[''] after:[background:radial-gradient(circle_at_10%_50%,var(--primary)_0.1rem,transparent_0.12rem)_0_50%/0.66rem_100%_repeat-x] ${i % 2 === 0 ? 'rotate-[-0.7deg] hover:rotate-0' : 'rotate-[0.7deg] hover:rotate-0'}`}
					>
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
						<ul class="mt-5 space-y-1.5 text-sm text-foreground/80">
							{#each r.items as item (item)}
								<li class="flex items-start gap-2">
									<span class="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/65"></span>
									{item}
								</li>
							{/each}
						</ul>
					</article>

					{#if i < roadmap.length - 1}
						<svg
							aria-hidden={true}
							viewBox="0 0 64 96"
							class="pointer-events-none absolute left-1/2 bottom-[-4.9rem] z-10 h-[5.3rem] w-[3.6rem] -translate-x-1/2 rotate-[4deg] text-[color-mix(in_oklab,var(--primary)_58%,var(--muted-foreground))] opacity-70 lg:hidden"
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
</section>

<!-- <section id="future-ideas" class="mx-auto max-w-6xl px-6 mt-16 scroll-mt-24">
	<div class="text-center mx-auto max-w-2xl">
		<span class="font-hand text-2xl text-muted-foreground/80">future ideas</span>
		<p class="mt-3 text-sm md:text-base text-muted-foreground max-w-lg mx-auto">
			Explore future ideas being considered. Click to discuss them and vote!
		</p>
	</div>

	<div class="mt-10">
		<div
			class="-mx-6 flex gap-3 overflow-x-auto px-6 pb-1 pr-1 snap-x snap-mandatory scrollbar-thin scroll-px-[9vw] sm:scroll-px-0"
		>
			{#each futureIdeaDomains as domain (domain.key)}
				<article
					class="w-[82vw] sm:w-[20rem] lg:w-76 shrink-0 snap-center sm:snap-start rounded-xl bg-sidebar px-4 py-4"
				>
					<div class="flex items-center justify-between gap-2">
						<div class="inline-flex items-center gap-2">
							<span aria-hidden={true} class="h-2 w-2 rounded-full bg-primary/45"></span>
							<h3 class="font-display text-base font-semibold text-foreground/85">
								{domain.label}
							</h3>
						</div>
						<span class="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/85">
							{domain.ideas.length}
						</span>
					</div>

					<SeparatorZigZag class="mt-3 mb-5" amplitude={3} pitch={5} opacity={0.2} />

					<ul class="mt-3 space-y-3 text-sm">
						{#each expandedIdeaDomains[domain.key] ? domain.ideas : domain.ideas.slice(0, FUTURE_IDEA_PREVIEW_COUNT) as idea (idea.label)}
							<li>
								<a
									href={idea.href}
									target="_blank"
									rel="noreferrer"
									class="inline-flex items-start gap-2 text-muted-foreground hover:text-foreground transition-colors"
								>
									<span class="text-primary/45">→</span>
									<span class="leading-snug underline-offset-2 hover:underline decoration-dotted">
										{idea.label}
									</span>
								</a>
							</li>
						{/each}
					</ul>

					{#if domain.ideas.length > FUTURE_IDEA_PREVIEW_COUNT}
						<button
							type="button"
							onclick={() => toggleIdeaDomain(domain.key)}
							class="mt-3 text-sm font-hand tracking-[0.12em] text-muted-foreground/85 hover:text-foreground transition-colors"
						>
							{#if expandedIdeaDomains[domain.key]}
								Collapse
							{:else}
								Expand +{domain.ideas.length - FUTURE_IDEA_PREVIEW_COUNT}
								<ChevronDown class="inline-block h-3 w-3" />
							{/if}
						</button>
					{/if}
				</article>
			{/each}
		</div>
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
</section> -->

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
			class="rounded-2xl order-2 md:order-1 bg-neutral-950 text-neutral-100 p-8 shadow-(--shadow-soft) border border-neutral-900 h-100 flex flex-col"
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
				class="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full bg-neutral-800 text-neutral-100 px-5 py-3 text-sm font-semibold hover:bg-neutral-700 transition"
			>
				<Github class="h-4 w-4" /> Read the docs <ExternalLink class="size-4" />
			</a>
		</div>

		<div
			class="relative rounded-2xl order-3 md:order-2 border-2 border-pink-500 bg-card p-8 shadow-(--shadow-lift) md:-translate-y-3 h-100 flex flex-col"
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
			<p class="mt-1 text-sm text-muted-foreground">5 € = 100 seeds 🌱 ≈ 100 recipe imports</p>
			<ul class="mt-6 space-y-3 text-sm">
				{#each ['Get your own seeds for some features', 'Unused seeds get shared to all users', "Accelerate Cuicuit's development", 'A very warm thank-you 🩷'] as t (t)}
					<li class="flex items-start gap-2">
						<Check class="h-4 w-4 mt-0.5 text-pink-500 shrink-0" />
						{t}
					</li>
				{/each}
			</ul>
			<button
				onclick={openSupportWall}
				class="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full bg-pink-500 px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
			>
				Support <Heart class="h-4 w-4" fill="#ffffff" /> & Get seeds 🌱
			</button>
		</div>

		<div
			class="rounded-2xl order-1 md:order-3 border border-border bg-card p-8 shadow-(--shadow-soft) h-100 flex flex-col"
		>
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
				{#each ['All features free with fair usage limits', "Use the community garden's seeds 🌱 gifted by supporters"] as t (t)}
					<li class="flex items-start gap-2">
						<Check class="h-4 w-4 mt-0.5 shrink-0" />
						{t}
					</li>
				{/each}

				<li class="flex items-start gap-2 text-amber-600">
					<TriangleAlert class="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
					Some features pause if not enough supporters plant community seeds
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

	<div class="relative mt-6 max-w-5xl mx-auto">
		<div class="flex flex-col items-center">
			<svg aria-hidden={true} viewBox="0 0 40 72" class="w-6 h-14 text-muted-foreground">
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

			<h3 class="mt-1 font-display text-2xl md:text-3xl font-semibold tracking-tight">
				What are seeds? 🌱
			</h3>

			<p class="mt-2 mx-4 text-balance text-sm text-muted-foreground max-w-2xl text-center">
				Cuicuit believes in a fair open concept: all features are free except costly ones to host.
				<br class="hidden sm:block" />
				By supporting Cuicuit, you get your own seeds to use and give some to all users.
				<br class="hidden sm:block" />
				Seeds let you import recipes from the web and
				<Button
					onclick={openSupportWall}
					variant="link"
					size="sm"
					class="text-sm text-muted-foreground p-0 font-normal underline decoration-dotted underline-offset-2 h-4"
				>
					more to come
				</Button>
				<ExternalLink class="size-2.5 inline-block" />.
			</p>

			<span class="mt-8 font-hand text-2xl text-muted-foreground">where your money goes:</span>
		</div>

		<div class="relative grid p-2 sm:p-4 md:p-8 pt-2 md:pt-2">
			<span
				class="absolute right-12 top-13 sm:-top-2 md:-top-4 text-right mb-2 text-muted-foreground/60 text-sm sm:text-md font-hand"
			>
				+ Your country's VAT
			</span>
			<div
				class="h-10 md:h-12 w-full rounded-full overflow-hidden flex drop-shadow-md border-4 border-white dark:border-primary"
			>
				<div
					class="basis-30/100 flex items-center justify-center text-[10px] md:text-xs text-foreground dark:text-muted bg-blue-300"
				>
					<div class="flex flex-col items-center">
						<span class="font-semibold">30%</span>
						<span>Yours</span>
					</div>
				</div>
				<div
					class="basis-15/100 flex items-center justify-center text-[10px] md:text-xs text-foreground dark:text-muted bg-pink-300"
				>
					<div class="flex flex-col items-center">
						<span class="font-semibold">15%</span>
						<span>Shared</span>
					</div>
				</div>
				<div
					class="basis-15/100 flex items-center justify-center text-[10px] md:text-xs text-foreground dark:text-muted bg-lime-300"
				>
					<div class="flex flex-col items-center">
						<span class="font-semibold">15%</span>
						<span class="hidden sm:inline-block">Development</span>
						<span class="inline-block sm:hidden">Dev.</span>
					</div>
				</div>
				<div
					class="basis-1/10 flex items-center justify-center text-[10px] md:text-xs text-foreground dark:text-muted bg-gray-200 border-r-2 border-gray-300 border-dashed"
				>
					<div class="flex flex-col items-center">
						<span class="font-semibold">10%</span>
						<span>Fees</span>
					</div>
				</div>
				<div
					class="basis-3/10 flex items-center justify-center text-[10px] md:text-xs text-foreground dark:text-muted bg-gray-200"
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
						<p class="font-semibold">Personal Seeds 🌱</p>
						<p class="text-muted-foreground text-xs leading-relaxed">
							Reserved for you to shield you from empty garden moments. Shared
							<br class="hidden sm:block" />
							if unused after 12 months.
						</p>
					</div>
				</div>
				<div class="flex gap-3 pr-3">
					<span class="mt-1 h-3 w-3 rounded-full bg-pink-300 shrink-0"></span>
					<div>
						<p class="font-semibold">Community Garden 🌱</p>
						<p class="text-muted-foreground text-xs leading-relaxed">
							Used by free users &amp; supporters with fair limits. If very healthy, used to fuel
							development.
						</p>
					</div>
				</div>
				<div class="flex gap-3">
					<span class="mt-1 h-3 w-3 rounded-full bg-lime-300 shrink-0"></span>
					<div>
						<p class="font-semibold">Servers &amp; Development</p>
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
							Cuicuit is seen as a regular software product by your & my countries. Payment fees on
							top.
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
			<details id={f.id} class="group rounded-2xl p-3">
				<summary
					class="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold"
				>
					<span
						class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition group-open:rotate-45"
					>
						+
					</span>
					<span class="w-full">
						{f.q}
					</span>
				</summary>
				<p class="mt-3 ml-12 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
			</details>
		{/each}
	</div>
</section>

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
					Hi! I’m Pierre, the human behind this little egg 😊. Cuicuit started as an app for myself:
					I love cooking, but I hate the 6pm panic of
					<em>“what’s for dinner, and what do we even have in the fridge?”</em>
				</p>
				<p>
					I wanted a kitchen companion that felt <em>helpful and efficient</em>, not like other
					cooking apps that need too many clicks and attention. The philosophy is simple:
					<span class="relative inline-block font-semibold text-primary">
						think about meals, not ingredients
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
					</span>. Jot down ideas at home, get a convenient list to go. Fancier features like
					pantry-aware recommendations will come after solid foundations.
				</p>
				<p>
					I love and rely on open source software every day. I want to give back to the community by
					making the best OSS everything-kitchen app! However, maintaining and improving Cuicuit
					takes a lot of effort, so I am exploring a few ways to support its development, such as a
					crowdfunded hosted version and direct donations.
				</p>
				<p>
					If you find it useful, a star on GitHub, voting for features, or a contribution to the
					moneypot keeps us growing. Every bit of support means more motivation I get to keep making
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
					<Github class="h-4 w-4" /> Star on GitHub
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
				Import your first recipe in under a minute. See you on the other side!
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
			Made with <Heart class="inline h-3.5 w-3.5 text-primary" /> and released as fully open-source.
		</p>
		<div class="flex items-genter gap-6">
			<ThemeButton />
			<a
				href="https://github.com/MadeInPierre/cuicuit"
				target="_blank"
				rel="noreferrer"
				class="inline-flex items-center gap-1.5 hover:text-foreground"
			>
				<Github class="h-4 w-4" /> GitHub
			</a>
		</div>
	</div>
</footer>

<SupportWallAutoDialog email={data.claims?.email || null} bind:open={openSupportDialog} />

<style>
	:global(html) {
		scroll-behavior: smooth;
	}
</style>
