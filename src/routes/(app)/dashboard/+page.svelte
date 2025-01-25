<script lang="ts">
	import { goto } from '$app/navigation';
	import { getUserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
	import { userState } from '$lib/features/auth/state/user.svelte';
	import ButtonThemed from '$lib/features/spaces/components/ButtonThemed.svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { auth } from '$lib/shared/db/firebase-client';
	import { syncMode } from '$lib/shared/state/persistent-sync-mode.svelte';
	import { jsonStringify } from '$lib/utils';
	import { signOut } from 'firebase/auth';
	import { Separator } from '$lib/shared/components/ui/separator';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	const userDocState = getUserDocState();
	const activeSpaceState = getActiveSpaceState();
</script>

<div class="space-y-6 pb-16 min-h-full">
	<div class="flex items-center">
		<div class="space-y-0.5">
			<h2 class="text-2xl font-bold tracking-tight">Dashboard</h2>
			<p class="text-muted-foreground">To be decided what to do with this page.</p>
		</div>
	</div>

	<Separator class="my-6" />

	<div class="flex gap-2 items-center m-2">
		<ButtonThemed
			onclick={() => {
				signOut(auth);
				goto('/');
			}}
		>
			Sign out
		</ButtonThemed>

		<ButtonThemed
			onclick={() => {
				syncMode.toggle();
			}}
		>
			{syncMode.mode}
		</ButtonThemed>
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
</div>
