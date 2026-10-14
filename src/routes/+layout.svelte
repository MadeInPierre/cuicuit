<script lang="ts">
	import { invalidate } from '$app/navigation';
	import posthog from 'posthog-js';
	import { toast } from 'svelte-sonner';
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
					// check for updates
					r &&
						setInterval(() => {
							// console.log('Checking for sw update')
							r.update();
						}, 60 * 1000);
					// console.log(`SW Registered: ${r}`);
				},
				onRegisterError(error: any) {
					console.log('SW registration error', error);
				},
				onNeedRefresh() {
					toast('Update available', {
						description: 'A new version of the app is ready.',
						action: {
							label: 'Reload',
							onClick: () => location.reload()
						},
						duration: Infinity
					});
				},
				onOfflineReady() {
					console.debug('App ready to work offline');
				}
			});
		}
	});

	// Warm the service worker's runtime cache for SvelteKit's `/_app/env.js`.
	// The app uses `$env/dynamic/public`, so prerendered pages (including the
	// offline /app-shell fallback) boot through a dynamic `import('/_app/env.js')`
	// that precaching can't cover (see vite.config.ts). SSR pages inline public
	// env and never request that URL themselves, so fetch it once while online,
	// the SW's `sveltekit-env` rule caches it for the day the network is gone.
	onMount(async () => {
		try {
			if (typeof caches === 'undefined' || !navigator.onLine) return;
			if (!(await caches.match('/_app/env.js'))) await fetch('/_app/env.js');
		} catch {
			// Offline on first visit (or Cache API unavailable), nothing to warm.
		}
	});

	// Get <meta> tags from the PWA manifest to be included in <head>
	const webManifest = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');

	// Refetch token when it expires
	onMount(() => {
		// `sb` is only set on the client (see +layout.ts); on the server it's null
		if (!sb) return;

		const { data } = sb.auth.onAuthStateChange((event, session) => {
			if (event === 'SIGNED_OUT') {
				posthog.reset();
			} else if (
				(event === 'SIGNED_IN' || event === 'INITIAL_SESSION') &&
				session?.user?.id
			) {
				posthog.identify(session.user.id, {
					email: session.user.email,
					name: session.user.user_metadata.full_name ?? session.user.user_metadata.name
				});
			}

			if (session?.expires_at !== claims?.exp) {
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
