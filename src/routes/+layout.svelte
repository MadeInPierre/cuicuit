<script lang="ts">
	import { Toaster } from '$lib/shared/components/ui/sonner';
	import * as Tooltip from '$lib/shared/components/ui/tooltip';
	import { ModeWatcher } from 'mode-watcher';
	import { onMount } from 'svelte';
	import '../app.css';
	import Metadata from './Metadata.svelte';
	// @ts-ignore
	import { pwaInfo } from 'virtual:pwa-info';

	let { children } = $props();

	onMount(async () => {
		if (pwaInfo) {
			// @ts-ignore
			const { registerSW } = await import('virtual:pwa-register');

			registerSW({
				immediate: true,
				onRegistered(r: ServiceWorkerRegistration | undefined) {
					// uncomment following code if you want check for updates
					// r && setInterval(() => {
					//    console.log('Checking for sw update')
					//    r.update()
					// }, 20000 /* 20s for testing purposes */)
					console.log(`SW Registered: ${r}`);
				},
				onRegisterError(error: any) {
					console.log('SW registration error', error);
				}
			});
		}
	});

	const webManifest = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');
</script>

<svelte:head>
	{@html webManifest}
</svelte:head>

<Metadata />
<ModeWatcher />
<Toaster />

<Tooltip.Provider>
	{@render children()}
</Tooltip.Provider>
