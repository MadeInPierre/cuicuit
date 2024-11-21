<script lang="ts">
	import Announcement from '$lib/features/marketing/components/Announcement.svelte';
	import * as PageHeader from '$lib/features/marketing/components/page-title';
	import { Button } from '$lib/shared/components/ui/button/index';
	import { Separator } from '$lib/shared/components/ui/separator';
	import { cn } from '$lib/utils';
	import { CheckCircle, Hourglass, Notebook } from 'lucide-svelte';

	const gradientColors: Record<string, string> = {
		emerald: 'from-emerald-500 to-yellow-400 darkfrom-emerald-400 dark:to-yellow-300',
		orange: 'from-orange-400 to-yellow-300',
		blue: 'from-blue-500 to-blue-300',
		red: 'from-red-500 to-red-300',
		purple: 'from-purple-500 to-purple-300'
	};

	let currentColor = $state('emerald');

	function toggleColor() {
		const colors = Object.keys(gradientColors);
		const currentIndex = colors.indexOf(currentColor);
		currentColor = colors[(currentIndex + 1) % colors.length];
	}
</script>

<div class="container">
	<PageHeader.Root class="relative pb-8">
		<div
			class={cn(
				'absolute left-1/2 top-1/2 h-[400px] w-full -translate-x-1/2 -translate-y-1/2 bg-black opacity-5 blur-[200px]',
				`bg-${currentColor}-500`
			)}
		></div>

		<Announcement class="z-10" />

		<PageHeader.Heading
			class={cn(
				'font-display z-10 inline-flex w-full flex-col gap-1 bg-gradient-to-r from-20% bg-clip-text py-2 text-center text-4xl font-bold leading-none text-transparent transition sm:text-6xl md:py-4 md:text-7xl lg:text-8xl',
				gradientColors[currentColor]
			)}
		>
			<span>Your favorite</span>
			<span>kitchen companion</span>
		</PageHeader.Heading>

		<PageHeader.Description class="z-10 text-muted-foreground">
			Cuicuit can do it all! Track what's in your kitchen, plan your future meals, get help
			selecting healthy products, and
			<!-- automatically buy your groceries in your nearest drive store. -->
			automate your groceries.
		</PageHeader.Description>

		<div class="z-10 flex w-full items-center justify-center space-x-4 py-4 md:pb-10">
			<Button href="/signup">Get started</Button>

			<Button href="/login" variant="link">Log in</Button>

			<!-- <Button target="_blank" rel="noreferrer" href="/" variant="outline">
				<Icons.gitHub class="mr-2 h-4 w-4" />
				GitHub
			</Button> -->
		</div>
	</PageHeader.Root>
</div>

<div class="container mb-40 text-center md:max-w-lg">
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<img
		src="/cuicuit_logo_transparent.png"
		alt="Cuicuit"
		class="mx-auto h-24"
		onclick={toggleColor}
	/>
	<h1 class="pt-2 text-2xl font-semibold">Cuicuit</h1>

	<div class="mx-auto flex items-center justify-center gap-2 pt-20">
		<img src="/cuicuit_logo_transparent.png" alt="Cuicuit" class="h-12" />
		<h1 class="pt-2 text-2xl font-semibold">Cuicuit</h1>
	</div>

	<img src="/cuicuit_logo.jpg" alt="Basket" class="mt-20 w-full" />
</div>

<div class="mx-auto grid w-full max-w-2xl space-y-3 rounded-xl bg-muted px-8 py-10 mb-20">
	<h1 class="pb-6 text-center text-2xl font-semibold">Features & Roadmap</h1>
	<div class="flex items-center gap-4 text-lg">
		<CheckCircle class="size-6 text-green-600" />
		Share your home with roommates and family in real-time
	</div>
	<div></div>
	<Separator class="bg-muted-foreground" />
	<div></div>
	<div class="flex items-center gap-4 text-lg">
		<Hourglass class="size-6 text-slate-500" />
		Create recipes, import from the web, or explore ideas
	</div>
	<div class="flex items-center gap-4 text-lg">
		<Hourglass class="size-6 text-slate-500" />
		Organize recipes by tags and filters in your cookbook
	</div>
	<div class="flex items-center gap-4 text-lg">
		<Hourglass class="size-6 text-slate-500" />
		Search for recipes by ingredients, tags, and filters
	</div>
	<div class="flex items-center gap-4 text-lg">
		<Hourglass class="size-6 text-slate-500" />
		Plan your meals for the week, optionally in a calendar
	</div>
	<div class="flex items-center gap-4 text-lg">
		<Hourglass class="size-6 text-slate-500" />
		Get notified when items are running low, add to list
	</div>
	<div class="flex items-center gap-4 text-lg">
		<Hourglass class="size-6 text-slate-500" />
		Scan receipts to track your pantry and fridge
	</div>
	<div class="flex items-center gap-4 text-lg">
		<Hourglass class="size-6 text-slate-500" />
		Get recipe suggestions using your pantry and preferences
	</div>
	<div class="flex items-center gap-4 text-lg">
		<Hourglass class="size-6 text-slate-500" />
		Get recipe suggestions using soon-to-expire ingredients
	</div>
	<div class="flex items-center gap-4 text-lg">
		<Hourglass class="size-6 text-slate-500" />
		Auto-generate meal plans based on your preferences
	</div>
	<div></div>
	<Separator class="bg-muted-foreground" />
	<div></div>
	<div class="flex items-center gap-4 text-lg">
		<Notebook class="size-6 text-slate-500" />
		Auto-buy your groceries in your nearest drive store
	</div>
</div>
