<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/shared/components/ui/button';
	import { supabase } from '$lib/shared/db/supabase-client.svelte';
	import { cn } from '$lib/utils';
	import { ArrowRight, Check, Home, Loader2, Pause, RotateCcw } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { Confetti } from 'svelte-confetti';
	import SeparatorZigZag from '../../../(app)/shopping-list/SeparatorZigZag.svelte';

	const { data } = $props();

	type PaymentStatus = 'confirming' | 'success' | 'failure';

	let status = $state<PaymentStatus>('confirming');
	const session_id = page.url.searchParams.get('session_id');

	let yourSeeds: number | undefined = $state(undefined);
	let communitySeeds: number | undefined = $state(undefined);

	onMount(() => {
		retryFetchCredits();
	});

	async function retryFetchCredits() {
		const MAX_RETRIES = 5;
		const RETRY_DELAY_MS = 3000;
		let attempt = 0;

		await new Promise((resolve) => setTimeout(resolve, 2000));

		const checkCredits = async () => {
			try {
				const credits = await getUserLatestCredits();
				if (credits.balance > 0) {
					yourSeeds = credits.yourSeeds;
					communitySeeds = credits.communitySeeds;
					status = 'success';
				} else {
					// Treat 0 balance or invalid response as a soft failure for retry
					throw new Error('Balance not greater than 0 or invalid response.');
				}
			} catch (e) {
				console.error(`Attempt ${attempt + 1} failed:`, e);
				attempt++;
				if (attempt < MAX_RETRIES) {
					setTimeout(checkCredits, RETRY_DELAY_MS);
				} else {
					status = 'failure';
				}
			}
		};

		checkCredits();
	}

	async function getUserLatestCredits() {
		status = 'confirming';
		if (!supabase.client) throw new Error('No supabase client');
		if (!data.claims?.sub) throw new Error('User not logged in');

		const { data: balanceData, error: balanceError } = await supabase.client
			?.from('credit_balances')
			.select('*')
			.eq('user_id', data.claims?.sub)
			.single();

		if (balanceError)
			throw new Error('Error getting balance: ' + JSON.stringify(balanceError, null, 2));

		if (!balanceData.balance || balanceData.balance <= 0)
			throw new Error('Balance is zero, negative, or invalid');

		const { data: logData, error: logError } = await supabase.client
			?.from('credit_logs')
			.select('*')
			.eq('user_id', data.claims?.sub)
			.eq('source', 'stripe_charge')
			.gt('amount', 0)
			.order('created_at', {
				ascending: false
			})
			.limit(1);

		if (logError)
			throw new Error('Error getting latest credit log: ' + JSON.stringify(logError, null, 2));

		const log = logData?.[0]; // Pick the latest operation

		console.log(
			'Balance:',
			balanceData,
			'Latest log:',
			logData,
			'Ms age:',
			Date.now() - Date.parse(log.created_at)
		);

		if (Date.now() - Date.parse(log.created_at) > 2 * 3600 * 1000) {
			throw new Error('Latest payment is >2h old.');
		}

		return {
			balance: balanceData.balance,
			yourSeeds: log.amount,
			communitySeeds: Math.ceil(log.amount / 2)
		};
	}
</script>

{#if status === 'success'}
	<div
		class="z-50"
		style="position: fixed; top: -50px; left: 0; height: 100vh; width: 100vw; display: flex; justify-content: center; overflow: hidden; pointer-events: none;"
	>
		<Confetti
			x={[-5, 5]}
			y={[0, 0.1]}
			delay={[500, 2000]}
			infinite
			duration={5000}
			amount={120}
			fallDistance="100vh"
		/>
	</div>
{/if}
<!-- <Confetti /> -->

<div class="relative min-h-screen overflow-hidden bg-background font-sans antialiased">
	<div
		aria-hidden={true}
		class="pointer-events-none absolute -top-40 -right-40 h-180 w-180 rounded-full bg-primary/10 blur-[120px]"
	></div>
	<div
		aria-hidden={true}
		class="pointer-events-none absolute top-40 -left-40 h-130 w-130 rounded-full bg-(--sage)/20 blur-[110px]"
	></div>
	<div
		aria-hidden={true}
		class="pointer-events-none absolute bottom-20 right-1/4 h-105 w-105 rounded-full bg-(--yolk)/20 blur-[100px]"
	></div>

	<div
		class="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-20"
	>
		<div class="w-full">
			<div
				class="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card p-8 shadow-(--shadow-lift) sm:p-12 sm:pb-8"
			>
				<div class="absolute left-0 right-0 top-0 h-1.5 bg-(--gradient-primary)"></div>

				<div class="flex flex-col items-center text-center">
					<div class="relative">
						<div
							class={cn(
								'flex h-28 w-28 items-center justify-center rounded-full transition-all duration-700 ease-out sm:h-32 sm:w-32',
								status === 'confirming' && 'bg-muted text-muted-foreground',
								status === 'success' &&
									'bg-lime-100 text-lime-600 dark:bg-lime-800 dark:text-lime-300',
								status === 'failure' && 'bg-destructive/10 text-destructive'
							)}
						>
							{#if status === 'confirming'}
								<Loader2 class="h-12 w-12 animate-spin sm:h-14 sm:w-14" />
							{:else if status === 'success'}
								<Check
									class={cn(
										'h-16 w-16 sm:h-20 sm:w-20',
										'animate-[scale-in_0.6s_ease-out,scale-in_0.6s_ease-out_0.6s]'
									)}
									stroke-width={2.5}
								/>
							{:else if status === 'failure'}
								<Pause class="h-16 w-16 sm:h-20 sm:w-20" stroke-width={2.5} />
							{/if}
						</div>

						{#if status === 'confirming'}
							<div class="absolute inset-0 -m-4 animate-spin" style="animationDuration: '8s'">
								<div
									class="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-primary/60"
								></div>
								<div
									class="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-primary/40"
								></div>
								<div
									class="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary/50"
								></div>
								<div
									class="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary/30"
								></div>
							</div>
						{/if}
					</div>

					<div class="mt-8">
						<h1
							class="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl flex items-center justify-center gap-4"
						>
							{#if status === 'confirming'}
								Confirming...
							{:else if status === 'success'}
								Thank you so much!
								<img src="/cuicuit_waving.png" class="size-10 inline-block" alt="Logo" />
							{:else if status === 'failure'}
								Something went wrong
							{/if}
						</h1>

						<p class="mt-3 max-w-xl text-balance text-base text-muted-foreground sm:text-md">
							{#if status === 'confirming'}
								We're double-checking your checkout with Stripe. Just a moment.
							{:else if status === 'success'}
								Thank you for supporting Cuicuit and planting seeds in the community garden. Your
								support helps keep Cuicuit open and delightful for everyone.
							{:else if status === 'failure'}
								Cuicuit couldn't confirm your payment right now. No worries, it is safely stored in
								Stripe and your seeds should appear in a few moments. You can try again or send an
								email and we'll fix it as soon as possible!
							{/if}
						</p>
					</div>

					{#if yourSeeds && communitySeeds && status === 'success'}
						<div
							class=" mt-4 w-full max-w-xl h-min flex flex-row items-center justify-between gap-4 sm:gap-8"
						>
							<div class="text-right w-full">
								<div class="font-hand text-lime-600 text-base lg:text-lg">you get</div>
								<div class="font-display text-2xl sm:text-3xl font-semibold leading-none">
									{yourSeeds.toLocaleString()}{' '}
									<span class="text-xl sm:text-2xl">🌱</span>
								</div>
								<div class="mt-1 text-xs text-muted-foreground">yours for 1 year</div>
							</div>

							<SeparatorZigZag
								direction="vertical"
								class="h-24 text-lime-600"
								pitch={5}
								opacity={0.8}
							/>

							<div class="text-left w-full">
								<div class="font-hand text-lime-600 text-base lg:text-lg">community gets</div>
								<div class="font-display text-2xl sm:text-3xl font-semibold leading-none">
									{communitySeeds.toLocaleString()}{' '}
									<span class="text-xl sm:text-2xl">🌱</span>
								</div>
								<div class="mt-1 text-xs text-muted-foreground">gifted to all users</div>
							</div>
						</div>
					{/if}

					<div class="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
						{#if status === 'success'}
							<Button
								href="/recipes"
								class="rounded-full bg-lime-600 hover:bg-lime-500 font-semi-bold shadow-(--shadow-soft) transition"
							>
								Start cooking <ArrowRight class="h-4 w-4" />
							</Button>
						{:else if status === 'failure'}
							<Button
								onclick={retryFetchCredits}
								class="rounded-full bg-primary font-semi-bold shadow-(--shadow-soft) transition"
							>
								<RotateCcw class="h-4 w-4" />
								Try again
							</Button>
						{/if}
						<Button
							href="/"
							class={cn(
								'rounded-full border border-border font-semi-bold transition hover:bg-secondary',
								status === 'success' ? 'bg-card text-foreground' : 'bg-card text-foreground'
							)}
						>
							<Home class="h-4 w-4" /> Go home
						</Button>
					</div>

					<div class="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
						<img src="/cuicuit_logo_transparent.png" class="size-6" alt="Logo" />
						<span class="font-hand text-lg text-primary">cui-cui, and thank you</span>
					</div>

					{#if session_id && status !== 'confirming'}
						<p class="mt-4 text-xs font-medium text-muted-foreground/70">
							Session ID: <span class="font-mono">{session_id.slice(0, 30)}...</span>
						</p>
					{/if}
				</div>
			</div>

			<div aria-hidden={true} class="mt-8 flex justify-center">
				<div class="relative -rotate-2">
					<span class="font-hand text-2xl text-primary/80">you're the best 🌷</span>
					<svg viewBox="0 0 160 20" class="w-32 h-4 text-primary/70">
						<path
							d="M2 14 Q 40 4, 80 10 T 158 8"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
					</svg>
				</div>
			</div>
		</div>
	</div>
</div>
