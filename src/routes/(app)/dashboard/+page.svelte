<script lang="ts">
	import { goto } from '$app/navigation';
	import ButtonThemed from '$lib/features/spaces/components/ButtonThemed.svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	// TODO import { syncMode } from '$lib/shared/state/persistent-sync-mode.svelte';
	import { jsonStringify } from '$lib/utils';
	import { Separator } from '$lib/shared/components/ui/separator';
	import { userState } from '$lib/features/auth/state/user-state.svelte';
	import { signOut } from '$lib/features/auth/actions/sign-out';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

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
		<ButtonThemed onclick={signOut}>Sign out</ButtonThemed>

		<!-- <ButtonThemed
			onclick={() => {
				syncMode.toggle();
			}}
		>
			{syncMode.mode}
		</ButtonThemed> -->
	</div>

	<pre class="w-[800px] overflow-hidden mb-8 rounded-md p-4 bg-muted">User Auth: {jsonStringify(
			userState.user
		)}</pre>
	<pre
		class="w-[800px] overflow-hidden mb-8 rounded-md p-4 bg-muted">User Preferences: {jsonStringify(
			userState.preferences
		)}</pre>
	<pre class="w-[800px] overflow-hidden mb-8 rounded-md p-4 bg-muted">User Profile: {jsonStringify(
			userState.profile
		)}</pre>
	<pre
		class="w-[800px] overflow-hidden mb-8 rounded-md p-4 bg-muted">Active Space: {activeSpaceState.id} {jsonStringify(
			activeSpaceState.activeSpace
		)}</pre>
</div>
