<script lang="ts">
	import { goto } from '$app/navigation';
	import { UserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
	import { userState } from '$lib/features/auth/state/user.svelte';
	import ThemeButton from '$lib/shared/components/ThemeButton.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { auth } from '$lib/shared/db/firebase-client';
	import { syncMode } from '$lib/shared/state/sync.svelte';
	import { jsonStringify } from '$lib/utils';
	import { signOut } from 'firebase/auth';
	import SyncStatus from './SyncStatus.svelte';

	const userDocState = new UserDocState();
</script>

<div class="flex gap-2 items-center m-2">
	<ThemeButton />

	<Button
		onclick={() => {
			signOut(auth);
			goto('/');
		}}
	>
		Sign out
	</Button>

	<Button
		onclick={() => {
			syncMode.toggle();
		}}
	>
		{syncMode.mode}
	</Button>

	<Button href="/settings">Settings</Button>

	{#if userDocState.doc}
		<SyncStatus status={userDocState.docState?.syncStatus || 'does-not-exist'} />
	{/if}
</div>

<pre>{jsonStringify(userDocState.doc)}</pre>
<pre>{jsonStringify(userState.user)}</pre>
