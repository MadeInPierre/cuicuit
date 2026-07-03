<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { LogMethod } from '$lib/features/auth/models/log-method';
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import UserAuthForm from '../user-auth-form.svelte';

	const userState = getUserState();

	// Redirect the user to dashboard if already logged in (or welcome if not done yet)
	$effect(() => {
		// If the user is already logged in...
		if (browser && userState.user?.id && userState.preferences) {
			if (userState.preferences.onboarding_status !== 'finished') {
				console.warn('User has not finished onboarding, redirect to welcome');
				goto('/welcome');
			} else {
				console.warn('User has finished onboarding, going to app.');
				goto('/recipes');
			}
		}
	});
</script>

<img src="/cuicuit_waving.png" alt="Cuicuit" class="h-16 mx-auto" />

<div class="flex flex-col space-y-2 text-center pb-3">
	<h1 class="text-2xl font-semibold tracking-tight">Welcome back!</h1>
	<p class="text-sm text-muted-foreground">How's it going?</p>
</div>

<UserAuthForm logMethod={LogMethod.LOGIN} />

<p class="px-8 text-center text-sm text-muted-foreground"></p>
