<script lang="ts">
	import { LogMethod } from '$lib/features/auth/models/log-method';
	import UserAuthForm from '../user-auth-form.svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	// import { getUserFullStore } from '$lib/stores/use:-full';

	// Redirect the user to dashboard if already logged in (or welcome if not done yet)
	// TODO let userFull = getUserFullStore();
	// $: if (browser && !$userFull.isLoading) {
	// 	if ($userFull.doc && $userFull.doc.checklist.welcome === false) {
	// 		goto('/welcome');
	// 	} else if ($userFull.user) {
	// 		goto('/dashboard');
	// 	}
	// }
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
