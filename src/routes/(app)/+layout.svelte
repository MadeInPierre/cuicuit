<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/shared/components/ui/sonner';
	// import HeaderContent from '$lib/shared/components/app/header/header-content.svelte';
	// import SiteHeader from '$lib/features/marketing/components/SiteHeader.svelte';
	import LoadingSplash from '$lib/shared/components/LoadingSplash.svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { createUserDocState } from '$lib/features/auth/state/user-doc-state.svelte';

	// Initialize the user doc state at the root app layout, will be used by all children
	const userDocState = createUserDocState();

	// Redirect the user to dashboard if already logged in (or welcome if not done yet)
	$effect(() => {
		// Only run this effect in the browser, not in the server
		if (browser) {
			if (userDocState.user === null) {
				console.warn('User is not logged in, redirect to signup');
				goto('/signup');
			} else if (userDocState.user && userDocState.doc) {
				if (userDocState.doc.checklist.welcome === false) {
					console.warn('User has not finished onboarding, redirect to welcome');
					goto('/welcome');
				}
			}
		}
	});

	const { children } = $props();
</script>

<ModeWatcher />
<Toaster />

<!-- Hide the app if the user was not welcomed yet (prevents flickering between state changes) -->
{#if userDocState.isLoading || (userDocState.doc && userDocState.doc.checklist.welcome === false) || userDocState.user === null}
	<LoadingSplash />
{:else}
	<!-- TODO Add app Navbar or Sidebar -->
	<!-- <SiteHeader><HeaderContent /></SiteHeader> -->

	{@render children?.()}
{/if}
