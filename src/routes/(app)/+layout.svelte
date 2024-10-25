<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { UserDocState } from '$lib/features/auth/state/user-doc.svelte';

	const userDocState = new UserDocState();

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

{@render children?.()}
