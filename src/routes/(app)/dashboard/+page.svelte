<script lang="ts">
	import { signOut } from '$lib/features/auth/actions/sign-out';
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import { createStripeCheckoutSession } from '$lib/features/billing/server/create-stripe-checkout-session.remote';
	import ButtonThemed from '$lib/features/spaces/components/ButtonThemed.svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { Separator } from '$lib/shared/components/ui/separator';
	import { supabase } from '$lib/shared/db/supabase-client.svelte';
	import { jsonStringify } from '$lib/utils';
	import { onMount } from 'svelte';
	import SyncStatus from './SyncStatus.svelte';

	const userState = getUserState();

	onMount(async () => {
		if (!supabase.client) throw new Error('No supabase client');

		const { data, error } = await supabase.client.auth.getClaims();
		if (data) console.log('Claims:', data);
		if (error) console.error('Error fetching claims:', error);
	});

	const activeSpaceState = getActiveSpaceState();

	async function testStripe() {
		console.log('TMP calling stripe checkout');
		const { url } = await createStripeCheckoutSession({
			amountChosen: 6,
			currency: 'EUR',
			interval: 'year'
		});

		// Send user to stripe checkout
		if (url) window.location.href = url;
	}
</script>

<div class="space-y-6 pb-16 min-h-full">
	<div class="flex items-center">
		<div class="space-y-0.5">
			<h2 class="text-2xl font-bold tracking-tight">Dashboard</h2>
			<p class="text-muted-foreground">To be decided what to do with this page.</p>
		</div>
	</div>

	<Separator class="my-6" />

	<Button
		onclick={() => {
			testStripe();
		}}
	>
		Test Stripe Session
	</Button>

	<div class="flex gap-2 items-center m-2">
		<ButtonThemed onclick={signOut}>Sign out</ButtonThemed>

		<SyncStatus status="offline" />
	</div>

	<pre class="w-200 text-xs overflow-hidden mb-8 rounded-md p-4 bg-muted">User Auth: {jsonStringify(
			userState.user
		)}</pre>
	<pre
		class="w-200 text-xs overflow-hidden mb-8 rounded-md p-4 bg-muted">User Preferences: {jsonStringify(
			userState.preferences
		)}</pre>
	<pre
		class="w-200 text-xs overflow-hidden mb-8 rounded-md p-4 bg-muted">User Profile: {jsonStringify(
			userState.profile
		)}</pre>
	<pre
		class="w-200 text-xs overflow-hidden mb-8 rounded-md p-4 bg-muted">Active Space: {activeSpaceState.id} {jsonStringify(
			activeSpaceState.activeSpace
		)}</pre>
</div>
