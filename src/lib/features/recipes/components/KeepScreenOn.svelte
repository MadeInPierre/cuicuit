<script lang="ts">
	import { browser } from '$app/environment';
	import { MediaQuery } from 'svelte/reactivity';
	import { Switch } from '$lib/shared/components/ui/switch/index.js';
	import { createPersistentState } from '$lib/shared/state/create-persistent-state.svelte';

	const supported = $derived(browser && 'wakeLock' in navigator);
	const coarsePointer = new MediaQuery('(pointer: coarse)');
	const isTouchDevice = $derived(
		browser && (coarsePointer.current || navigator.maxTouchPoints > 0)
	);

	const keepScreenOnState = createPersistentState<boolean>('keep-screen-on', false, {
		toString: (v) => String(v),
		fromString: (s) => s === 'true'
	});

	let keepScreenOn = $state(keepScreenOnState.value ?? false);
	let wakeLock: any = $state(null);

	$effect(() => {
		keepScreenOnState.value = keepScreenOn;
	});

	async function acquireWakeLock() {
		if (!browser || !('wakeLock' in navigator)) return;
		try {
			wakeLock = await (navigator as any).wakeLock.request('screen');
			wakeLock?.addEventListener?.('release', () => {
				wakeLock = null;
			});
		} catch (e) {
			console.error('Wake lock request failed', e);
			keepScreenOn = false;
			wakeLock = null;
		}
	}

	async function releaseWakeLock() {
		if (wakeLock) {
			try {
				await wakeLock.release();
			} catch {
				// ignore
			}
			wakeLock = null;
		}
	}

	$effect(() => {
		if (!browser) return;
		if (keepScreenOn) {
			acquireWakeLock();
		} else {
			releaseWakeLock();
		}
		return () => {
			releaseWakeLock();
		};
	});

	$effect(() => {
		if (!browser) return;
		const onVisibilityChange = () => {
			if (document.visibilityState === 'visible' && keepScreenOn && !wakeLock) {
				acquireWakeLock();
			}
		};
		document.addEventListener('visibilitychange', onVisibilityChange);
		return () => document.removeEventListener('visibilitychange', onVisibilityChange);
	});
</script>

{#if supported && isTouchDevice}
	<div class="flex items-center justify-between rounded-md bg-sidebar px-3 py-2 text-sm">
		<span class="text-muted-foreground">Keep screen on</span>
		<Switch bind:checked={keepScreenOn} />
	</div>
{/if}
