<script lang="ts">
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';

	const userState = getUserState();
</script>

<p>
	You have {userState.creditBalance?.balance || 0} personal seeds and the community seeds amount is currently
	{userState.creditBalance?.communityHealth || 'unknown'}.
</p>

<p>
	This screen will be improved soon with detailed balance, usage, history, and community health
	details.
</p>
