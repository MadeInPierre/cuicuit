<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/shared/components/ui/button';
</script>

<div class="flex flex-col gap-6 items-center">
	<img src="/cuicuit_waving.png" alt="Cuicuit" class="h-16 mx-auto" />

	<div class="flex flex-col space-y-2 text-center">
		<h1 class="text-2xl font-semibold tracking-tight">Welcome to Cuicuit!</h1>
		<p class="text-sm text-muted-foreground">
			You have been invited to join a shared Cuicuit space. Start your new cooking journey!
		</p>
	</div>

	<Button
		class="w-full"
		onclick={() => {
			localStorage.setItem('invite-join-space-id', page.params.spaceid || '');
			goto('/signup');
		}}
	>
		Accept invite
	</Button>
</div>
