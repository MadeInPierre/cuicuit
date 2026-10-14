<script lang="ts">
	import { connectivity } from '$lib/shared/state/connectivity.svelte';
	import { WifiOff } from '@lucide/svelte';

	const offline = $derived(!connectivity.online);
</script>

{#if offline}
	<div
		role="status"
		class="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-100 px-4 py-1.5 text-center text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-100"
	>
		<WifiOff class="size-3.5 shrink-0" />
		<span>You're offline, limited functionality.</span>
	</div>
{/if}
