<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import { FEATURE_COSTS, MIN_SUPPORT_AMOUNT, SEEDS_PER_UNIT } from '$lib/features/billing/consts';
	import { contributionFromParams, contributionSchema } from '$lib/features/billing/contribution';
	import { clearSupportIntent, saveSupportIntent } from '$lib/features/billing/support-intent';
	import { createStripeCheckoutSession } from '$lib/features/billing/server/create-stripe-checkout-session.remote';
	import { Button } from '$lib/shared/components/ui/button';
	import { siteConfig } from '$lib/shared/config/site-config';
	import { connectivity, requireOnline } from '$lib/shared/state/connectivity.svelte';
	import { cn } from '$lib/utils';
	import {
		ArrowRight,
		ChevronRight,
		ExternalLink,
		Heart,
		LoaderCircle,
		Lock,
		Sprout
	} from '@lucide/svelte';
	import { isHttpError } from '@sveltejs/kit';
	import posthog from 'posthog-js';
	import { onMount, untrack } from 'svelte';
	import { toast } from 'svelte-sonner';
	import SeedSteps from './SeedSteps.svelte';

	let { email = null }: { email: string | null } = $props();

	const FREQUENCIES = [
		{ id: 'month', label: 'Monthly', per: '/ month' },
		{ id: 'year', label: 'Yearly', per: '/ year' },
		{ id: 'once', label: 'One-time', per: 'once' }
	] as const;
	const SYMBOLS = { eur: '€', usd: '$', gbp: '£' } as const;
	const PRESETS = [3, 5, 10];
	const id = $props.id();
	const userState = getUserState();
	const accountEmail = $derived(userState.user?.email ?? email);
	const initial = contributionFromParams(untrack(() => page.url.searchParams));

	let currency = $state<keyof typeof SYMBOLS>(initial?.currency ?? 'eur');
	let frequency = $state<'month' | 'year' | 'once'>(initial?.interval ?? 'month');
	let amount = $state<number | undefined>(initial?.amountChosen ?? 5);
	let submitting = $state(false);
	let needsLogin = $state(false);
	let checkoutError = $state('');
	let ready = $state(false);
	const signedIn = $derived(!!accountEmail && !needsLogin);

	onMount(() => {
		ready = true;
	});

	const sym = $derived(SYMBOLS[currency]);
	const per = $derived(FREQUENCIES.find((f) => f.id === frequency)!.per);
	const selection = $derived(
		contributionSchema.safeParse({ amountChosen: amount, currency, interval: frequency })
	);
	const valid = $derived(selection.success);
	const value = $derived(selection.success ? selection.data.amountChosen : 0);
	const amountError = $derived(
		amount === undefined || !Number.isFinite(amount) || amount < MIN_SUPPORT_AMOUNT
			? `Enter ${sym}${MIN_SUPPORT_AMOUNT} or more to cover transaction fees.`
			: 'Use no more than two decimal places.'
	);
	const yourSeeds = $derived(Math.round(value * SEEDS_PER_UNIT.private));
	const gardenSeeds = $derived(Math.round(value * SEEDS_PER_UNIT.public));
	const imports = $derived(Math.floor(yourSeeds / FEATURE_COSTS.import_recipe_from_website.seeds));

	function money(value: number) {
		return new Intl.NumberFormat('en', {
			style: 'currency',
			currency: currency.toUpperCase(),
			minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
			maximumFractionDigits: 2
		}).format(value);
	}

	$effect(() => {
		if (accountEmail) clearSupportIntent();
	});

	async function onSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (submitting || !selection.success) return;
		const contribution = selection.data;
		checkoutError = '';
		submitting = true;
		try {
			if (!(await requireOnline('Checkout'))) {
				submitting = false;
				return;
			}
			if (!signedIn) {
				saveSupportIntent(contribution);
				await goto('/login');
				return;
			}
			const { url } = await createStripeCheckoutSession(contribution);
			if (!url) throw new Error('Stripe did not return a checkout URL.');
			posthog.capture('checkout_started', {
				amount: contribution.amountChosen,
				currency,
				frequency
			});
			window.location.assign(url);
		} catch (error) {
			console.error('Could not continue to contribution checkout.', error);
			needsLogin = isHttpError(error, 401);
			checkoutError = needsLogin
				? 'Your session expired. Log in again to continue with these choices.'
				: 'Could not open checkout. Your choices are still here. Please try again.';
			toast.error('Could not open checkout', { description: checkoutError });
			submitting = false;
		}
	}

	const segment =
		'flex min-h-11 cursor-pointer items-center justify-center rounded-full px-3 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-background hover:text-foreground has-checked:bg-background has-checked:text-foreground has-checked:shadow-(--shadow-soft) has-focus-visible:ring-2 has-focus-visible:ring-ring motion-reduce:transition-none';
</script>

<div class="px-5 py-6 sm:px-8 sm:py-8">
	<header class="pr-8">
		<h1
			class="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl flex items-center gap-3"
		>
			<img
				src="/cuicuit_waving.webp"
				alt=""
				aria-hidden={true}
				width="96"
				height="96"
				loading="lazy"
				decoding="async"
				class="h-10 w-10 -rotate-6"
			/>
			Support Cuicuit
		</h1>
		<p class="mt-3 max-w-lg text-foreground/80">
			Help Cuicuit remain free by getting your own recipe imports.
		</p>
		<p class="mt-2 max-w-lg text-sm text-foreground/75">
			Seeds are credits for recipe imports. Contribute to guarantee your own seeds and help the
			community fund. All other features are free.
		</p>
	</header>

	<form onsubmit={onSubmit} class="mt-6">
		<fieldset disabled={!ready || submitting} class="grid gap-6 lg:grid-cols-2 lg:gap-10">
			<legend class="sr-only">Choose your contribution</legend>
			<div class="space-y-5">
				<fieldset class="grid grid-cols-3 gap-1 rounded-full bg-secondary p-1">
					<legend class="sr-only">Contribution frequency</legend>
					{#each FREQUENCIES as f (f.id)}
						<label class={segment}>
							<input
								type="radio"
								name="{id}-frequency"
								value={f.id}
								bind:group={frequency}
								class="sr-only"
							/>
							{f.label}
						</label>
					{/each}
				</fieldset>

				<fieldset class="grid grid-cols-3 gap-2">
					<legend class="mb-2 text-sm font-semibold">Choose an amount</legend>
					{#each PRESETS as preset (preset)}
						<label
							class="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border-2 border-input bg-card font-display text-xl font-semibold transition-colors hover:border-primary has-checked:border-primary has-checked:bg-primary/10 has-focus-visible:ring-2 has-focus-visible:ring-ring motion-reduce:transition-none"
						>
							<input
								type="radio"
								name="{id}-preset"
								value={preset}
								checked={amount === preset}
								onchange={() => (amount = preset)}
								class="sr-only"
							/>
							{sym}{preset}
						</label>
					{/each}
				</fieldset>

				<div class="flex items-end gap-3">
					<div class="min-w-0 flex-1">
						<label for="{id}-amount" class="mb-2 block text-sm font-semibold"
							>Or your own amount</label
						>
						<div
							class="flex min-h-12 items-center gap-2 rounded-xl border border-input bg-card px-3 focus-within:ring-2 focus-within:ring-ring"
						>
							<span aria-hidden="true">{sym}</span>
							<input
								id="{id}-amount"
								type="number"
								inputmode="decimal"
								min={MIN_SUPPORT_AMOUNT}
								step="1"
								required
								bind:value={amount}
								aria-invalid={!valid}
								aria-describedby="{id}-amount-help"
								class="min-w-0 w-full bg-transparent py-3 text-lg font-semibold tabular-nums outline-none"
							/>
						</div>
					</div>
					<div>
						<label for="{id}-currency" class="mb-2 block text-sm font-semibold">Currency</label>
						<select
							id="{id}-currency"
							bind:value={currency}
							class="min-h-12 rounded-xl border border-input bg-card px-3 text-base font-semibold focus-visible:ring-2 focus-visible:ring-ring"
						>
							{#each Object.keys(SYMBOLS) as c (c)}
								<option value={c}>{c.toUpperCase()}</option>
							{/each}
						</select>
					</div>
				</div>
				<p
					id="{id}-amount-help"
					class={cn('text-sm', !valid ? 'font-semibold text-primary' : 'text-foreground/75')}
					aria-live="polite"
				>
					{#if !valid}
						{amountError}
					{/if}
				</p>
			</div>

			<div>
				<div
					class="border-y-2 border-dashed border-foreground/20 py-4"
					aria-live="polite"
					aria-atomic="true"
				>
					<div class="flex items-center justify-between gap-3">
						<h2 class="font-hand text-2xl text-primary">Your seed packet</h2>
						<Sprout class="size-5 text-primary" aria-hidden="true" />
					</div>
					{#if amount !== undefined && Number.isFinite(amount)}
						<p class="mt-2 break-words font-display text-3xl font-semibold tabular-nums">
							{money(amount)} <span class="font-sans text-base font-normal">{per}</span>
						</p>
					{/if}
					{#if valid}
						<p class="mt-2 text-sm text-foreground/80">
							<span class="font-semibold text-foreground"
								>{imports.toLocaleString()} recipe imports for you</span
							>
							({yourSeeds.toLocaleString()} seeds), plus
							<span class="font-semibold text-foreground"
								>{gardenSeeds.toLocaleString()} shared seeds</span
							>
							to help others try the app.
						</p>
					{:else}
						<p class="mt-2 text-sm text-foreground/80">
							Choose a valid amount to see your recipe imports.
						</p>
					{/if}
					<p class="mt-2 text-sm text-foreground/75">
						{frequency === 'month'
							? 'Renews monthly.'
							: frequency === 'year'
								? 'Renews yearly.'
								: 'One payment. No subscription.'}
						Unused seeds return to the garden after 12 months.
					</p>
				</div>

				{#if !signedIn}
					<p class="mt-4 text-sm text-foreground/80">
						Your choices will be kept. After login, review them before continuing to Stripe.
					</p>
				{/if}
				<Button
					type="submit"
					disabled={!ready || !valid || !connectivity.online || submitting}
					class="mt-5 min-h-12 w-full rounded-full text-base font-semibold"
				>
					{#if !ready}
						Preparing contribution…
					{:else if submitting}
						<LoaderCircle
							class="size-4 animate-spin motion-reduce:animate-none"
							aria-hidden="true"
						/>
						{signedIn ? 'Opening Stripe…' : 'Going to login…'}
					{:else if !connectivity.online}
						Checkout needs a connection
					{:else if !valid}
						Check your amount
					{:else if !signedIn}
						Log in to contribute
						<ArrowRight class="size-4" aria-hidden="true" />
					{:else}
						Contribute
						{money(value)}
						{per}
						<ArrowRight class="size-4" aria-hidden="true" />
					{/if}
				</Button>
				{#if checkoutError}
					<p role="alert" class="mt-3 text-sm font-medium text-primary">{checkoutError}</p>
				{/if}
				{#if frequency !== 'once'}
					<p class="mt-2 text-center text-sm text-foreground/75">
						<a
							href={siteConfig.links.billingPortal}
							target="_blank"
							rel="noreferrer"
							class="inline-flex min-h-11 items-center gap-1 underline underline-offset-4"
						>
							Cancel or change your support anytime
							<ExternalLink class="size-3.5" aria-hidden="true" />
						</a>
					</p>
				{/if}
				<p class="mt-3 text-center text-sm text-foreground/75">
					{#if signedIn}
						<span class="block break-all">Paying as {accountEmail}</span>
					{/if}
					<span class="inline-flex items-center gap-1 text-foreground/80">
						<Lock class="size-4" aria-hidden="true" />
						Secure checkout by Stripe
					</span>
				</p>
			</div>
		</fieldset>
	</form>
	<noscript>
		<p class="mt-4 text-sm text-foreground/80">
			Enable JavaScript to choose a contribution. You can still
			<a href={siteConfig.links.billingPortal} class="underline underline-offset-4"
				>manage existing support through Stripe</a
			>.
		</p>
	</noscript>

	<details class="group mt-6">
		<summary class="flex min-h-11 cursor-pointer items-center gap-1 font-medium">
			How do seeds work?
			<ChevronRight
				class="size-4 transition-transform group-open:rotate-90 text-primary translate-y-0.2 motion-reduce:transition-none"
				aria-hidden="true"
			/>
		</summary>
		<SeedSteps {sym} class="mt-5" />
		<p class="mt-5 text-sm text-foreground/75">
			Planning, shopping lists and sharing stay free. Seeds are only used for recipe imports.
		</p>
	</details>
</div>
