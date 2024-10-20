<script lang="ts">
	import Announcement from '$lib/components/marketing/Announcement.svelte';
	import * as PageHeader from '$lib/components/marketing/page-header';
	import { Button } from '$lib/components/ui/button/index';
	import { cn } from '$lib/utils';

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
			Track what's in your kitchen, plan your future meals, get help selecting healthy products, and
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
	<!-- <img src="/basket.png" alt="Basket" class="w-full" /> -->

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
