<script lang="ts">
	import { page } from '$app/state';
	import { clearSupportIntent, getSupportIntent } from '$lib/features/billing/support-intent';
	import { onMount } from 'svelte';
	import { Heart } from '@lucide/svelte';
	import Transition from './transition.svelte';

	interface Props {
		data: { url: string };
		children?: import('svelte').Snippet;
	}

	let { data, children }: Props = $props();

	const TopRightComponent = $derived(page.data.topRight);
	let supportReturn = $state<string | null>(null);
	onMount(() => {
		supportReturn = getSupportIntent();
	});
</script>

<svelte:head>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="relative h-screen lg:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
	<div class="absolute right-6 top-6 z-20 md:right-9 md:top-9">
		{#if TopRightComponent}
			<TopRightComponent />
		{/if}
	</div>

	<a href="/" class="absolute flex gap-2 left-6 top-6 z-20 md:left-9 md:top-9 lg:text-white">
		<img src="/cuicuit_logo_transparent.png" alt="Cuicuit" class="h-10" />
		<h1 class="pt-2 text-lg font-medium">Cuicuit</h1>
	</a>

	<div class="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
		<div
			class="absolute inset-0 bg-cover bg-center"
			style={`background-image: url(${page.data.backgroundUrl});`}
		></div>

		<div class="relative z-20 mt-auto">
			<blockquote class="space-y-2">
				<!-- <p class="text-lg">
					&ldquo;This library has saved me countless hours of work and helped me deliver stunning
					designs to my clients faster than ever before. Highly recommended!&rdquo;
				</p> -->
				<footer class="inline-flex items-center gap-1 text-sm">
					Made with <span><Heart class="h-3 w-3" fill="white" /></span> by
					<a
						href="https://linkedin.com/in/pierre-laclau"
						class="hover:underline decoration-dotted underline-offset-4">Pierre Laclau</a
					>
				</footer>
			</blockquote>
		</div>
	</div>

	<div class="relative mx-auto flex h-screen flex-col justify-center w-full max-w-[380px]">
		{#if supportReturn}
			<div class="mx-4 mb-6 rounded-xl border border-border bg-card p-4 text-center text-sm">
				<p class="font-semibold">Your contribution is saved.</p>
				<p class="mt-1 text-muted-foreground">
					Log in or create an account, then review it before opening Stripe.
				</p>
				<a
					href={supportReturn}
					onclick={clearSupportIntent}
					class="mt-2 inline-flex min-h-11 items-center underline underline-offset-4"
					>Back to contribution</a
				>
			</div>
		{/if}
		<Transition url={data.url} direction={page.data.direction}>
			{@render children?.()}
		</Transition>
	</div>
</div>
