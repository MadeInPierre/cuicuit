<script lang="ts">
	import { LogMethod } from '$lib/features/auth/models/log-method';
	import UserAuthForm from '../user-auth-form.svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	// import { getUserFullStore } from '$lib/stores/user-full';

	// TODO Redirect the user to dashboard if already logged in (or welcome if not done yet)
	// let userFull = getUserFullStore();
	// $: if (browser && !$userFull.isLoading) {
	// 	if ($userFull.doc && $userFull.doc.checklist.welcome === false) {
	// 		goto('/welcome');
	// 	} else if ($userFull.user) {
	// 		goto('/dashboard');
	// 	}
	// }
</script>

<div class="flex flex-col space-y-2 text-center">
	<h1 class="text-2xl font-semibold tracking-tight">Welcome back!</h1>
	<p class="text-sm text-muted-foreground">Choose your method below to see your kitchen</p>
</div>

<UserAuthForm logMethod={LogMethod.LOGIN} />

<p class="px-8 text-center text-sm text-muted-foreground"></p>
