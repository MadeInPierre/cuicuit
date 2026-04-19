<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { userState } from '$lib/features/auth/state/user-state.svelte';
	import { createActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import LoadingSplash from '$lib/shared/components/LoadingSplash.svelte';
	import MobileBottomNavbar from '$lib/shared/components/mobile-bottom-navbar.svelte';
	import SidebarPage from '$lib/shared/components/sidebar-page.svelte';
	import { Toaster } from '$lib/shared/components/ui/sonner';
	import { ModeWatcher } from 'mode-watcher';

	// Initialize the active space state, this will create a persistent state
	// that will be used to store the active space and its related data
	createActiveSpaceState(userState);

	// Redirect the user to dashboard if already logged in (or welcome if not done yet)
	$effect(() => {
		// Only run this effect in the browser, not in the server
		if (browser) {
			if (userState.user === null) {
				console.warn('User is not logged in, redirect to signup');
				goto('/signup');
			}

			// Forbid this zone if the user has not finished his onboarding
			else if (userState.preferences && userState.preferences.onboarding_status !== 'finished') {
				console.warn('User has not finished onboarding, redirect to welcome');
				goto('/welcome');
			}
		}
	});

	const { children } = $props();

	// Disable right click context menu globally to prevent issues with the app's interactions
	// Used to prevent mobile & tablet users from triggering the context menu when long pressing,
	// which is used instead for drag and drop, long press to show item details in sidebar, etc.
	window.oncontextmenu = function (event) {
		event.preventDefault();
		event.stopPropagation();
		return false;
	};

	let openChat = $state(false);
</script>

<ModeWatcher />
<Toaster />

<!-- Hide the app if the user was not welcomed yet (prevents flickering between state changes) -->
<!-- TODO userDocState.doc.checklist.welcome === false -->
{#if !userState.isComplete}
	<LoadingSplash />
{:else}
	<!-- {#if openChat}
		<ChatBackdrop />
	{/if} -->

	<SidebarPage>
		{@render children?.()}
	</SidebarPage>

	<MobileBottomNavbar bind:openChat />
{/if}
