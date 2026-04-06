<script lang="ts">
	import {
		CloudCheck,
		CloudDownload,
		CloudOff,
		CloudUpload,
		LoaderCircle,
		Unplug,
		X
	} from 'lucide-svelte';

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

{#snippet component(s: string)}
	<div class="group w-min flex items-center gap-2 whitespace-nowrap text-sm">
		{#if s === 'loading'}
			<LoaderCircle class="w-4 h-4 animate-spin" />
		{:else if s === 'does-not-exist'}
			<X class="w-4 h-4 text-red-600" />
		{:else if s === 'offline'}
			<CloudOff class="text-gray-500 size-5" />
		{:else if s === 'pending'}
			<Unplug class="text-yellow-600 size-5" />
		{:else if s === 'uploading'}
			<CloudUpload class="text-blue-600 size-5" />
		{:else if s === 'downloading'}
			<CloudDownload class="text-blue-600 size-5" />
		{:else if s === 'synchronized'}
			<CloudCheck class="text-green-600 size-5" />
		{/if}

		<span class="group-hover:block hidden text-muted-foreground">{statusLabel[s]}</span>
	</div>
{/snippet}

{@render component('does-not-exist')}
{@render component('offline')}
{@render component('pending')}
{@render component('uploading')}
{@render component('downloading')}
{@render component('synchronized')}
