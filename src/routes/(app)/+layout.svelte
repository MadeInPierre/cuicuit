<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import { getSupportIntent } from '$lib/features/billing/support-intent';
	import { createActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte.js';
	import LoadingSplash from '$lib/shared/components/LoadingSplash.svelte';
	import MobileBottomNavbar from '$lib/shared/components/mobile-bottom-navbar.svelte';
	import SidebarPage from '$lib/shared/components/sidebar-page.svelte';
	import { Toaster } from '$lib/shared/components/ui/sonner';
	import { connectivity } from '$lib/shared/state/connectivity.svelte';
	import { RotateCw, WifiOff } from '@lucide/svelte';
	import { ModeWatcher } from 'mode-watcher';

	const { data, children } = $props();

	// Initialize the active space state, this will create a persistent state
	const userState = getUserState();
	createActiveSpaceState(userState);

	// Degraded = the device is offline, or user-data fetches failed on transport
	// errors (broken signal). While degraded we never auto-redirect: redirects
	// are auth decisions and we can't verify auth without the network.
	const degraded = $derived(!connectivity.online || userState.isOfflineDegraded);
	// Ticking clock so a JWT that expires while the app sits open offline flips
	// the UI to the "reconnect" card instead of staying on stale chrome.
	let now = $state(Date.now());
	$effect(() => {
		if (!browser) return;
		const timer = setInterval(() => (now = Date.now()), 60_000);
		return () => clearInterval(timer);
	});
	const sessionExpired = $derived(
		userState.sessionExpiresAt !== null && userState.sessionExpiresAt * 1000 <= now
	);
	// Optimistic shell: render chrome as soon as a (cached, unexpired) session is
	// known. `LoadingSplash` shows only while auth is genuinely unknown.
	const canRenderApp = $derived(!!userState.user && !sessionExpired);
	// Safety net: if auth stays unknown for a long time, stop spinning and
	// show the retry card instead of an infinite splash.
	let authStalled = $state(false);
	$effect(() => {
		if (!browser) return;
		if (userState.user !== undefined) return;
		const timer = setTimeout(() => (authStalled = true), 6000);
		return () => clearTimeout(timer);
	});

	// Redirect the user to dashboard if already logged in (or welcome if not done yet)
	$effect(() => {
		// Only run this effect in the browser, not in the server.
		// Skipped entirely while degraded (see above).
		if (browser && !degraded) {
			const supportReturn = getSupportIntent();
			if (supportReturn && userState.user?.email_confirmed_at) {
				goto(supportReturn);
				return;
			}
			if (userState.user === null) {
				console.warn('User is not logged in, redirect to signup');
				goto('/signup');
			}

			// Forbid this zone if the user has not finished his onboarding
			else if (
				userState.preferences !== undefined &&
				(userState.preferences === null || userState.preferences.onboarding_status !== 'finished')
			) {
				console.warn('User has not finished onboarding, redirect to welcome');
				goto('/welcome');
			}
		}
	});

	// Disable right click context menu globally to prevent issues with the app's interactions
	// Used to prevent mobile & tablet users from triggering the context menu when long pressing,
	// which is used instead for drag and drop, long press to show item details in sidebar, etc.
	if (browser)
		window.oncontextmenu = function (event) {
			event.preventDefault();
			event.stopPropagation();
			return false;
		};

	let openChat = $state(false);
</script>

<ModeWatcher />
<Toaster />

<!-- Optimistic shell: chrome renders on cached session; Splash only for unknown auth. -->
{#if canRenderApp}
	<!-- {#if openChat}
		<ChatBackdrop />
	{/if} -->

	<SidebarPage>
		{@render children?.()}
	</SidebarPage>

	<MobileBottomNavbar bind:openChat />
{:else if degraded && (userState.user === null || sessionExpired)}
	{@render offlineNoSession()}
{:else if userState.user === undefined && authStalled}
	{@render stalledAuth()}
{:else}
	<LoadingSplash />
{/if}

{#snippet offlineNoSession()}
	<!-- Offline with no cached session (or an expired one that can't be refreshed):
		signing in needs a connection, so explain instead of redirect-looping. -->
	<div
		class="flex h-screen w-screen flex-col items-center justify-center space-y-6 bg-background px-6 text-center text-muted-foreground"
	>
		<img src="/cuicuit_logo_transparent.png" alt="Cuicuit" class="h-12" />
		<div class="flex max-w-sm flex-col items-center space-y-2">
			<div class="flex items-center gap-2 text-sm font-medium text-foreground">
				<WifiOff class="h-4 w-4" />
				{#if sessionExpired}
					Session expired
				{:else}
					You're offline
				{/if}
			</div>
			<p class="text-sm">
				{#if sessionExpired}
					Reconnect to refresh your session — your saved data will sync when you're back.
				{:else}
					Signing in needs a connection. Your saved session still works offline once you've signed
					in.
				{/if}
			</p>
		</div>
		<button
			type="button"
			onclick={() => location.reload()}
			class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
		>
			<RotateCw class="h-4 w-4" />
			Retry
		</button>
	</div>
{/snippet}

{#snippet stalledAuth()}
	<!-- Auth stayed unknown past the timeout (hung network, storage blocked):
		still waiting in the background, but don't spin forever. -->
	<div
		class="flex h-screen w-screen flex-col items-center justify-center space-y-6 bg-background px-6 text-center text-muted-foreground"
	>
		<img src="/cuicuit_logo_transparent.png" alt="Cuicuit" class="h-12" />
		<div class="flex max-w-sm flex-col items-center space-y-2">
			<div class="flex items-center gap-2 text-sm font-medium text-foreground">
				Taking longer than expected
			</div>
			<p class="text-sm">
				We couldn't confirm you're logged in. Check your connection, we'll keep trying.
			</p>
		</div>
		<button
			type="button"
			onclick={() => location.reload()}
			class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
		>
			<RotateCw class="h-4 w-4" />
			Retry
		</button>
	</div>
{/snippet}
