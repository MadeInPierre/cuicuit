<script lang="ts">
	import type { DocSyncStatus } from '$lib/shared/db/doc-state.svelte';
	import CloudCheck from '$lib/shared/icons/cloud-check.svelte';
	import { Loader2, X, CloudOff, CloudUpload, CloudDownload } from 'lucide-svelte';

	interface Props {
		status: DocSyncStatus;
	}

	const { status }: Props = $props();

	// Old icons
	// import {
	// 	disabled,
	// 	downloading,
	// 	pending,
	// 	synchronized,
	// 	uploading
	// } from '$lib/shared/icons/sync-icons';
	// const statusIcon: Record<DocSyncStatus, any> = {
	// 	'does-not-exist': disabled,
	// 	loading: undefined,
	// 	offline: disabled,
	// 	pending: pending,
	// 	uploading: uploading,
	// 	downloading: downloading,
	// 	synchronized: synchronized
	// };

	const statusLabel: Record<DocSyncStatus, string> = {
		'does-not-exist': 'Does not exist',
		loading: 'Loading...',
		offline: 'Offline',
		pending: 'Disabled (Pending)',
		uploading: 'Updating',
		downloading: 'Synchronizing',
		synchronized: 'Up to date'
	};
</script>

<div class="group w-min flex items-center gap-2 whitespace-nowrap text-sm">
	{#if status === 'loading'}
		<Loader2 class="w-4 h-4 animate-spin" />
	{:else if status === 'does-not-exist'}
		<X class="w-4 h-4 text-red-600" />
	{:else if status === 'offline'}
		<CloudOff class="text-gray-500 size-5" />
	{:else if status === 'pending'}
		<CloudOff class="text-yellow-600 size-5" />
	{:else if status === 'uploading'}
		<CloudUpload class="text-blue-600 size-5" />
	{:else if status === 'downloading'}
		<CloudDownload class="text-blue-600 size-5" />
	{:else if status === 'synchronized'}
		<CloudCheck class="text-green-600 size-5" />
	{/if}

	<span class="group-hover:block hidden text-muted-foreground">{statusLabel[status]}</span>
</div>
