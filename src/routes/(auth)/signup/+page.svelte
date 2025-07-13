<script lang="ts">
	import { LogMethod } from '$lib/features/auth/models/log-method';
	import UserAuthForm from '../user-auth-form.svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { userState } from '$lib/features/auth/state/user-state.svelte';

	// Redirect the user to dashboard if already logged in (or welcome if not done yet)
	$effect(() => {
		// If the user is already logged in...
		if (browser && userState.user?.id && userState.preferences) {
			if (userState.preferences.onboarding_status !== 'finished') {
				console.warn('User has not finished onboarding, redirect to welcome');
				goto('/welcome');
			} else {
				console.warn('User has finished onboarding, going to dashboard.');
				goto('/dashboard');
			}
		}
	});
</script>

<div class="flex flex-col space-y-2 text-center">
	<h1 class="text-2xl font-semibold tracking-tight">Nice to meet you!</h1>
	<p class="text-sm text-muted-foreground">Create your account to start cooking</p>
</div>

<UserAuthForm logMethod={LogMethod.SIGNUP} />

<p class="mx-auto w-[290px] text-center text-sm text-muted-foreground">
	By clicking continue, you agree to our{' '}
	<a href="/terms" class="underline underline-offset-4 hover:text-primary">
		Terms of Service
	</a>{' '}
	and{' '}
	<a href="/privacy" class="underline underline-offset-4 hover:text-primary"> Privacy Policy </a>
	.
</p>
