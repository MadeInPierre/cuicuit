<script lang="ts">
	import { goto } from '$app/navigation';
	import { getUserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
	import { userState } from '$lib/features/auth/state/user.svelte';
	import ThemeButton from '$lib/shared/components/ThemeButton.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { auth } from '$lib/shared/db/firebase-client';
	import { syncMode } from '$lib/shared/state/sync.svelte';
	import { jsonStringify } from '$lib/utils';
	import { signOut } from 'firebase/auth';
	import SyncStatus from './SyncStatus.svelte';

	const userDocState = getUserDocState();
</script>

<div class="flex gap-2 items-center m-2">
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

	{#if userDocState.doc}
		<SyncStatus status={userDocState.docState?.syncStatus || 'does-not-exist'} />
	{/if}
</div>

<pre class="w-[800px] overflow-hidden">{jsonStringify(userDocState.doc)}</pre>
<pre class="w-[800px] overflow-hidden">{jsonStringify(userState.user)}</pre>
