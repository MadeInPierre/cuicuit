<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { Toaster } from '$lib/shared/components/ui/sonner';
	import * as Tooltip from '$lib/shared/components/ui/tooltip';
	import { ModeWatcher } from 'mode-watcher';
	import { onMount } from 'svelte';
	import '../app.css';
	import Metadata from './Metadata.svelte';
	// @ts-ignore
	import { pwaInfo } from 'virtual:pwa-info';

	let { data, children } = $props();
	let { supabase: sb, claims } = $derived(data);

	// Register Service Worker
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
					// console.log(`SW Registered: ${r}`);
				},
				onRegisterError(error: any) {
					console.log('SW registration error', error);
				}
			});
		}
	});

	// Get <meta> tags from the PWA manifest to be included in <head>
	const webManifest = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');

	// Refetch token when it expires
	onMount(() => {
		const { data } = sb.auth.onAuthStateChange((event, _session) => {
			if (_session?.expires_at !== claims?.exp) {
				console.log('Supabase session token expired, refreshing.');
				invalidate('supabase:auth');
			}
		});
		return () => data.subscription.unsubscribe();
	});
</script>

<svelte:head>
	{@html webManifest}
</svelte:head>

<Metadata />
<ModeWatcher defaultMode="light" />
<Toaster />

<Tooltip.Provider>
	{@render children()}
</Tooltip.Provider>
