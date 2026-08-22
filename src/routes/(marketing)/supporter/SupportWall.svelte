<script lang="ts">
	import { goto } from '$app/navigation';
	import { FEATURE_COSTS } from '$lib/features/billing/consts';
	import { createStripeCheckoutSession } from '$lib/features/billing/server/create-stripe-checkout-session.remote';
	import { Button } from '$lib/shared/components/ui/button';
	import { Input } from '$lib/shared/components/ui/input';
	import { Label } from '$lib/shared/components/ui/label';
	import { Slider } from '$lib/shared/components/ui/slider';
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';
	import { cn } from '$lib/utils';
	import posthog from 'posthog-js';
	import { ArrowRight, Check, ExternalLink, Heart } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	type Props = {
		email: string | null;
	};
	let { email = null }: Props = $props();

	type Frequency = 'month' | 'year' | 'once';
	type Currency = 'EUR' | 'USD' | 'GBP';

	const CURRENCIES: Record<Currency, { symbol: string; label: string }> = {
		EUR: { symbol: '€', label: 'EUR' },
		USD: { symbol: '$', label: 'USD' },
		GBP: { symbol: '£', label: 'GBP' }
	};

	const FREQUENCIES: { id: Frequency; label: string; hint: string }[] = [
		{ id: 'month', label: 'Monthly', hint: 'recurring hug' },
		{ id: 'year', label: 'Yearly', hint: 'annual harvest' },
		{ id: 'once', label: 'One-time', hint: 'single sprinkle' }
	];

	const TIERS = [
		{ at: 2, label: 'Help cover server costs', emoji: '🐣' },
		{ at: 4, label: 'Cover your own usage', emoji: '🙌' },
		{ at: 6, label: 'Buy a beer to the developer', emoji: '🍻' },
		{ at: 8, label: "Accelerate Cuicuit's growth", emoji: '🕊' },
		{ at: 15, label: 'Wow, thank you so much!', emoji: '🌟' }
	];

	// 1-20 step 1, then 25-100 step 5 → 36 total positions
	const MAX_SLIDER = 46;

	const EUR_TO_PRIVATE_SEEDS = 20;
	const EUR_TO_PUBLIC_SEEDS = 10;
	const MIN_AMOUNT = 3;

	function sliderToAmount(value: number): number {
		if (value <= 20) return value;
		return 20 + (value - 20) * 5;
	}

	function amountToSlider(amount: number): number {
		if (amount <= 20) return Math.max(1, Math.round(amount));
		return Math.min(MAX_SLIDER, 20 + Math.round((amount - 20) / 5));
	}

	let amount = $state(5);
	let currency = $state<Currency>('EUR');
	let frequency = $state<Frequency>('month');

	const amountMonthly = $derived(frequency === 'month' ? amount : amount / 12);

	const belowMin = $derived(amount < MIN_AMOUNT);
	const yourSeeds = $derived(Math.round(amount * EUR_TO_PRIVATE_SEEDS));
	const communitySeeds = $derived(Math.round(amount * EUR_TO_PUBLIC_SEEDS));
	const sliderValue = $derived(amountToSlider(amount));

	const activeTiers = $derived(
		TIERS.map((t) => ({ ...t, on: !belowMin && amountMonthly >= t.at }))
	);

	const sym = $derived(CURRENCIES[currency].symbol);
	const freqLabel = $derived(
		frequency === 'month' ? 'a month' : frequency === 'year' ? 'a year' : 'once'
	);

	const handleSliderChange = (value: number) => {
		amount = sliderToAmount(value ?? 1);
	};

	async function onSubmit() {
		if (!email) {
			toast.error('Please login first', {
				description: 'Login and come back, thanks!',
				duration: 15000,
				action: {
					label: 'Login',
					onClick: () => {
						goto('/login');
					}
				}
			});
			localStorage.setItem('navigate-intent', 'supporter-page');
			return;
		}

		const { url } = await createStripeCheckoutSession({
			amountChosen: amount,
			currency: currency.toLowerCase(),
			interval: frequency
		});

		if (url) {
			posthog.capture('checkout_started', {
				amount,
				currency,
				frequency
			});
			window.location.href = url;
		}
	}

	const media = useMedia();
</script>

<div class="relative pt-4 px-5 sm:px-6 lg:px-8">
	<div
		aria-hidden={true}
		class="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full opacity-40 blur-3xl bg-pink-500/50"
	></div>

	<div class="absolute bottom-16 right-12 text-muted-foreground/80 text-right p-2 text-[10px]">
		{#if email}
			Logged in as <span class="font-semibold">{email}</span>
		{:else}
			You will be asked to login first
		{/if}
	</div>

	<div class="gap-2 flex flex-col">
		<div class="flex items-center gap-2 font-hand text-pink-500 text-lg lg:text-xl">
			<Heart class="h-4 w-4 fill-pink-500" /> thank you{(media.md && ' for your support') || ''}!
		</div>
		<h1 class="font-serif font-semibold text-2xl sm:text-3xl lg:text-4xl leading-tight">
			Plant a few seeds in the community garden
		</h1>
		<div
			class="*:[a]:hover:text-foreground *:[a]:underline *:[a]:underline-offset-3 text-sm sm:text-base text-muted-foreground"
		>
			Every <span class="font-semibold text-foreground">{sym}1</span> grows{' '}
			<span class="font-semibold text-foreground">{EUR_TO_PRIVATE_SEEDS} seeds 🌱</span> for you and{' '}
			<span class="font-semibold text-foreground">{EUR_TO_PUBLIC_SEEDS} seeds 🌱</span> shared with everyone.
		</div>
	</div>

	<div class="mt-8 flex flex-col-reverse lg:grid gap-5 lg:grid-cols-2 lg:gap-6">
		<div>
			<div class="flex items-end justify-between gap-4">
				<div>
					<Label class="text-xs uppercase tracking-wide text-muted-foreground">Amount</Label>
					<div class="mt-0.5 font-display text-2xl sm:text-3xl font-semibold">
						{sym}{amount}
						<span class="ml-1 text-sm font-normal text-muted-foreground">
							/ {frequency === 'once' ? 'one-time' : frequency === 'month' ? 'month' : 'year'}
						</span>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<div class="flex overflow-hidden rounded-full border border-border h-7">
						{#each Object.keys(CURRENCIES) as Currency[] as c (c)}
							<button
								type="button"
								onclick={() => (currency = c)}
								class={cn(
									'px-2.5 py-1.5 text-xs font-semibold transition',
									currency === c
										? 'bg-primary text-primary-foreground'
										: 'bg-popover text-muted-foreground hover:bg-secondary'
								)}
							>
								{c}
							</button>
						{/each}
					</div>
					<Input
						type="number"
						min={0}
						value={amount}
						onchange={(e) => {
							amount = Math.max(0, Number((e.target as HTMLInputElement)?.value || 0));
						}}
						class="w-16 bg-popover rounded-full h-7 border-border"
					/>
				</div>
			</div>
			<Slider
				type="single"
				value={sliderValue}
				min={1}
				max={MAX_SLIDER}
				step={1}
				onValueChange={handleSliderChange}
				class="mt-3"
			/>
			<div class="mt-1 flex justify-between text-[10px] text-muted-foreground">
				<span>1</span>
				<span class="mr-13">20</span>
				<span>150</span>
			</div>
		</div>

		<div>
			<Label class="text-xs uppercase tracking-wide text-muted-foreground">Frequency</Label>
			<div class="mt-1.5 grid grid-cols-3 gap-2 rounded-full bg-muted p-1">
				{#each FREQUENCIES as f (f.id)}
					<button
						type="button"
						onclick={() => {
							if (frequency === 'month' && f.id === 'year') amount = amount * 12;
							if (frequency === 'month' && f.id === 'once') amount = amount * 12;
							if (frequency === 'year' && f.id === 'month') amount = Math.round(amount / 12);
							if (frequency === 'once' && f.id === 'month') amount = Math.round(amount / 12);

							frequency = f.id;
						}}
						class={cn(
							'rounded-full px-2 pt-0.5 text-xs sm:text-sm font-semibold transition',
							frequency === f.id
								? 'bg-background shadow-(--shadow-soft) text-foreground'
								: 'text-muted-foreground hover:text-foreground'
						)}
					>
						<div>{f.label}</div>
						<div class="font-hand -mt-1.5 text-sm sm:text-lg font-normal text-primary/70">
							{f.hint}
						</div>
					</button>
				{/each}
			</div>
		</div>
	</div>

	<div class="mt-4 sm:mt-0 mb-4 grid gap-5 lg:grid-cols-2 lg:gap-6">
		<div class="p-4 sm:p-5">
			<div class="flex flex-row items-center justify-between gap-3">
				<div>
					<div class="font-hand text-primary text-base lg:text-lg">you get</div>
					<div class="font-display text-3xl sm:text-4xl font-semibold leading-none">
						{yourSeeds.toLocaleString()}{' '}
						<span class="text-xl sm:text-2xl">seeds 🌱</span>
					</div>
					<div class="mt-1 text-xs text-muted-foreground">
						{(frequency === 'year' &&
							`yours for 1 year — avg. ${(yourSeeds / 12).toFixed(0)} / month`) ||
							''}
						{(frequency === 'month' && 'rolls over for 12 months') || ''}
						{(frequency === 'once' && 'yours to spend for 1 year') || ''}
					</div>
				</div>
				<div class="text-right">
					<div class="font-hand text-primary text-base lg:text-lg">community gets</div>
					<div class="font-display text-2xl sm:text-3xl font-semibold leading-none">
						{communitySeeds.toLocaleString()}{' '}
						<span class="text-lg">🌱</span>
					</div>
					<div class="mt-1 text-xs text-muted-foreground">gifted to all users</div>
				</div>
			</div>

			<div class="mt-4 rounded-2xl bg-accent/50 backdrop-blur p-3 sm:p-4">
				<div
					class="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5"
				>
					<!-- <Book class="h-3.5 w-3.5" />  -->
					What can seeds do?
					<span class="ml-auto">You get</span>
				</div>
				<ul class="relative text-xs sm:text-sm">
					<div
						class="absolute z-10 top-1/2 right-8 w-28 translate-y-4 text-lg font-hand text-primary text-center leading-4 -rotate-2"
					>
						More features coming!
					</div>

					{#each Object.values(FEATURE_COSTS).filter((feature) => feature.display) as f (f.name)}
						{@const canDo = Math.floor(yourSeeds / f.seeds)}

						<li class={cn('flex items-center gap-2 py-1.5', f.comingSoon && 'opacity-60 blur-xs')}>
							<span class="w-14 text-center font-semibold whitespace-nowrap">
								{f.seeds} 🌱
							</span>
							<span class="col-span-1 w-full">{f.name}</span>
							<span
								class="w-18 flex items-center justify-end gap-1 text-right font-semibold text-primary"
							>
								<!-- <Repeat class="h-3 w-3" /> -->
								{canDo.toLocaleString()}×
							</span>
						</li>
					{/each}

					<li class="mt-2 italic text-xs text-muted-foreground w-full text-center">
						Only costly backend features need seeds, otherwise all free!
					</li>
				</ul>
			</div>
		</div>

		<div
			class="p-4 sm:p-5 h-min bg-card rounded-xl rotate-2 mx-auto sm:mx-8 shadow-(--shadow-soft) my-auto max-w-md"
		>
			<div
				class="text-pink-500 font-display text-sm sm:text-lg font-semibold leading-none text-center"
			>
				your monthly contributions
			</div>
			<ul class="mt-1.5 rounded-2xl p-3 space-y-1">
				{#each activeTiers as t (t.at)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<li
						onclick={() => {
							amount = frequency === 'month' ? Math.max(MIN_AMOUNT, t.at) : t.at * 12;
						}}
						class={cn(
							'flex items-center gap-2.5 rounded-lg px-1.5 py-0.5 transition',
							t.on ? 'text-foreground' : 'text-muted-foreground/40'
						)}
					>
						<button
							class={cn(
								'flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-md border transition',
								t.on
									? 'border-pink-500 bg-pink-500 text-primary-foreground'
									: 'border-border bg-background'
							)}
						>
							{#if t.on}
								<Check class="h-3 w-3 sm:h-4 sm:w-4" />
							{/if}
						</button>
						<span class="text-base sm:text-lg">{t.emoji}</span>
						<span
							class={cn(
								'text-md sm:text-lg flex-1 font-hand',
								t.on ? 'font-medium' : 'line-through decoration-dotted'
							)}
						>
							{t.label}
						</span>
						<span class="text-[10px] sm:text-xs font-semibold text-muted-foreground">
							{sym}
							{t.at}+
							<span class="text-[10px] font-normal">/ m</span>
						</span>
					</li>
				{/each}
			</ul>
		</div>
	</div>

	<div class="h-30 sm:hidden"></div>

	<div class={cn(!media.md && 'fixed bottom-0 left-0 right-0 py-4 px-8 bg-background')}>
		<Button
			onclick={onSubmit}
			disabled={belowMin}
			class={cn(
				'w-full rounded-full px-6 py-3.5 sm:py-4 text-sm sm:text-base font-semibold transition shadow-(--shadow-lift)',
				belowMin && 'cursor-not-allowed'
			)}
		>
			<span class="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
				<!-- <Sprout class="h-5 w-5" /> -->
				{#if belowMin}
					Please pick at least {sym}{MIN_AMOUNT} to sprout something
				{:else}
					Plant {sym}{amount}
					{freqLabel}
					<ArrowRight class="size-4" />
					Get {yourSeeds.toLocaleString()} 🌱
					{(media.md && `and gift ${communitySeeds.toLocaleString()} 🌱`) || ''}
				{/if}
			</span>
		</Button>
		{#if belowMin}
			<p class="h-5 mt-2 text-sm text-amber-600 w-full text-center font-medium">
				Minimum {sym}{MIN_AMOUNT} due to payment fees, sorry! Please prefer yearly or one-time contributions.
			</p>
		{:else}
			<Button
				href="https://github.com/sponsors/MadeInPierre"
				target="_blank"
				variant="link"
				size="sm"
				class="h-5 mt-2 w-full text-center text-xs"
			>
				Don't need seeds? Support
				{#if media.md}development directly{/if}
				on GitHub Sponsors
				<ExternalLink class="size-2.5" />
			</Button>
		{/if}
	</div>
</div>
