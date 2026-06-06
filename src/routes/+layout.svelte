<script lang="ts">
	import { Toaster } from '$lib/shared/components/ui/sonner';
	import * as Tooltip from '$lib/shared/components/ui/tooltip';
	import { ModeWatcher } from 'mode-watcher';
	import { onMount } from 'svelte';
	import '../app.css';
	import Metadata from './Metadata.svelte';

	let { children } = $props();

	onMount(async () => {
		if ('serviceWorker' in navigator) {
			try {
				const { registerSW } = await import('virtual:pwa-register');
				registerSW({ immediate: true });
			} catch (error) {
				console.log('Service Worker registration failed:', error);
			}
		}
	});
</script>

<Metadata />
<ModeWatcher />
<Toaster />

<Tooltip.Provider>
	{@render children()}
</Tooltip.Provider>
