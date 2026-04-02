<script lang="ts">
	import CloudCheck from '$lib/shared/icons/cloud-check.svelte';
	import { CloudDownload, CloudOff, CloudUpload, LoaderCircle, X } from 'lucide-svelte';

	interface Props {
		status: string;
	}

	const { status }: Props = $props();

	const statusLabel: Record<string, string> = {
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
		<LoaderCircle class="w-4 h-4 animate-spin" />
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
