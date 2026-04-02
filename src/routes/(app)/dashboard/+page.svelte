<script lang="ts">
	import { signOut } from '$lib/features/auth/actions/sign-out';
	import { userState } from '$lib/features/auth/state/user-state.svelte';
	import ButtonThemed from '$lib/features/spaces/components/ButtonThemed.svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { Separator } from '$lib/shared/components/ui/separator';
	import { supabase } from '$lib/shared/db/supabase-client';
	import { jsonStringify } from '$lib/utils';
	import { onMount } from 'svelte';
	import SyncStatus from './SyncStatus.svelte';

	onMount(async () => {
		const { data, error } = await supabase.auth.getClaims();
		if (data) console.log('Claims:', data);
		if (error) console.error('Error fetching claims:', error);
	});

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

		<SyncStatus status="offline" />
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
