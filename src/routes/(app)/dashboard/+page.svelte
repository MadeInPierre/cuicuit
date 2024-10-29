<script lang="ts">
	import { goto } from '$app/navigation';
	import { getUserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
	import { userState } from '$lib/features/auth/state/user.svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { auth } from '$lib/shared/db/firebase-client';
	import { syncMode } from '$lib/shared/state/persistent-sync-mode.svelte';
	import { jsonStringify } from '$lib/utils';
	import { signOut } from 'firebase/auth';

	const userDocState = getUserDocState();
	const activeSpaceState = getActiveSpaceState();
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
</div>

<pre
	class="w-[800px] overflow-hidden mb-8 rounded-md p-4 bg-muted">active SpaceDoc {activeSpaceState.id} {jsonStringify(
		activeSpaceState.doc
	)}</pre>
<pre class="w-[800px] overflow-hidden mb-8 rounded-md p-4 bg-muted">UserDoc {userDocState.user
		?.uid} {jsonStringify(userDocState.doc)}</pre>
<pre class="w-[800px] overflow-hidden mb-8 rounded-md p-4 bg-muted">User Auth {jsonStringify(
		userState.user
	)}</pre>
