<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import { FEATURE_COSTS, MIN_SUPPORT_AMOUNT, SEEDS_PER_UNIT } from '$lib/features/billing/consts';
	import { contributionFromParams, contributionSchema } from '$lib/features/billing/contribution';
	import { clearSupportIntent, saveSupportIntent } from '$lib/features/billing/support-intent';
	import { createStripeCheckoutSession } from '$lib/features/billing/server/create-stripe-checkout-session.remote';
	import { Button } from '$lib/shared/components/ui/button';
	import { connectivity, requireOnline } from '$lib/shared/state/connectivity.svelte';
	import { cn } from '$lib/utils';
	import { ArrowRight, ChevronRight, ExternalLink, LoaderCircle, Lock, Sprout } from '@lucide/svelte';
	import { isHttpError } from '@sveltejs/kit';
	import posthog from 'posthog-js';
	import { untrack } from 'svelte';
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
	const signedIn = $derived(!!accountEmail && !needsLogin);

	const sym = $derived(SYMBOLS[currency]);
	const per = $derived(FREQUENCIES.find((f) => f.id === frequency)!.per);
	const selection = $derived(
		contributionSchema.safeParse({ amountChosen: amount, currency, interval: frequency })
	);
	const valid = $derived(selection.success);
	const value = $derived(valid ? (amount ?? 0) : 0);
	const yourSeeds = $derived(Math.round(value * SEEDS_PER_UNIT.private));
	const gardenSeeds = $derived(Math.round(value * SEEDS_PER_UNIT.public));
	const imports = $derived(Math.floor(yourSeeds / FEATURE_COSTS.import_recipe_from_website.seeds));

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
	<header class="pr-5">
		<h1 class="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
			Plant seeds and support us
		</h1>
		<p class="mt-3 max-w-prose text-foreground/80">
			Help keep Cuicuit free. Get your own recipe imports and give to the community.
		</p>
	</header>

	<form onsubmit={onSubmit} class="mt-6">
		<fieldset disabled={submitting} class="grid gap-6 lg:grid-cols-2 lg:gap-10">
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
							class="min-h-12 rounded-xl border border-input bg-card px-3 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-ring"
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
						Sorry, we require {sym}{MIN_SUPPORT_AMOUNT} or more due to transaction fees.
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
					<p class="mt-2 font-display text-3xl font-semibold tabular-nums">
						{sym}{value} <span class="font-sans text-base font-normal">{per}</span>
					</p>
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
					<p class="mt-2 text-sm text-foreground/75">
						{frequency === 'month'
							? 'Renews monthly.'
							: frequency === 'year'
								? 'Renews yearly.'
								: 'One payment. No subscription.'}
						Unused seeds return to the garden after 12 months.
					</p>
				</div>

				<Button
					type="submit"
					disabled={!valid || !connectivity.online || submitting}
					class="mt-5 min-h-12 w-full rounded-full text-base font-semibold"
				>
					{#if submitting}
						<LoaderCircle
							class="size-4 animate-spin motion-reduce:animate-none"
							aria-hidden="true"
						/>
						{signedIn ? 'Opening Stripe…' : 'Going to login…'}
					{:else if !connectivity.online}
						Checkout needs a connection
					{:else}
						Contribute
						{sym}{valid ? amount : MIN_SUPPORT_AMOUNT}
						{per}
						<ArrowRight class="size-4" aria-hidden="true" />
					{/if}
				</Button>
				{#if checkoutError}
					<p role="alert" class="mt-3 text-sm font-medium text-primary">{checkoutError}</p>
				{/if}
				{#if frequency !== 'once'}
					<p class="mt-2 text-center text-sm text-foreground/75">
						Cancel anytime by just coming back to this page.
					</p>
				{/if}
				<p class="mt-3 text-center text-xs text-foreground/75">
					{#if signedIn}
						<span class="block break-all">Paying as {accountEmail}</span>
					{:else}
						<span class="block break-all">You'll be asked to log in first, then taken to Stripe.</span>
					{/if}
					<span class="inline-flex items-center gap-1 text-foreground/80">
						<Lock class="size-4" aria-hidden="true" />
						Secure checkout by Stripe
					</span>
				</p>
			</div>
		</fieldset>
	</form>

	<details class="group mt-6">
		<summary class="flex min-h-11 cursor-pointer items-center gap-1 font-medium">
			How do seeds work?
			<ChevronRight class="size-4 transition-transform group-open:rotate-90 text-primary translate-y-0.2" aria-hidden="true" />
		</summary>
		<SeedSteps {sym} class="mt-5" />
		<p class="mt-5 text-sm text-foreground/75">
			Planning, shopping lists and sharing stay free. Seeds are only used for recipe imports.
		</p>
	</details>
	<!-- <p class="mt-3 text-center text-sm">
		<a
			href="https://github.com/sponsors/MadeInPierre"
			target="_blank"
			rel="noreferrer"
			class="inline-flex min-h-11 items-center gap-1 text-foreground/80 underline underline-offset-4 hover:text-foreground"
		>
			Prefer to sponsor on GitHub? <ExternalLink class="size-3.5" aria-hidden="true" />
		</a>
	</p> -->
</div>
