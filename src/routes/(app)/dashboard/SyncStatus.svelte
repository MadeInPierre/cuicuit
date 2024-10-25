<script lang="ts">
	import type { DocSyncStatus } from '$lib/shared/db/doc-state.svelte';
	import {
		disabled,
		downloading,
		pending,
		synchronized,
		uploading
	} from '$lib/shared/icons/sync-icons';
	import { Loader2, X } from 'lucide-svelte';

	interface Props {
		status: DocSyncStatus;
	}

	const { status }: Props = $props();

	const statusIcon: Record<DocSyncStatus, any> = {
		'does-not-exist': disabled,
		loading: undefined,
		offline: disabled,
		pending: pending,
		uploading: uploading,
		downloading: downloading,
		synchronized: synchronized
	};

	const statusLabel: Record<DocSyncStatus, string> = {
		'does-not-exist': 'Does not exist',
		loading: 'Loading...',
		offline: 'Offline',
		pending: 'Disabled (Pending)',
		uploading: 'Updating',
		downloading: 'Synchronizing',
		synchronized: 'Synchronized'
	};
</script>

<p
	class="w-min flex items-center gap-2 border-2 border-gray-300 rounded-md px-4 py-1.5 whitespace-nowrap"
>
	{#if status === 'loading'}
		<Loader2 class="w-4 h-4 animate-spin" />
	{:else if status === 'does-not-exist'}
		<X class="w-4 h-4 text-red-600" />
	{:else}
		{@html statusIcon[status]}
	{/if}

	{statusLabel[status]}
</p>
