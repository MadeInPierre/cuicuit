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

	$inspect(
		'page user & userDoc',
		userDocState.user,
		userDocState.doc,
		userDocState.docFromCache,
		userDocState.docHasPendingWrites,
		userDocState.syncStatus
	);
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

	<SyncStatus status={userDocState.syncStatus} />
</div>

<pre>{jsonStringify(userDocState.doc)}</pre>
<pre>{jsonStringify(userState.user)}</pre>
