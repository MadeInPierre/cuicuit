import { createPersistentState } from '$lib/shared/state/create-persistent-state.svelte';

export let hideBannerUntil = createPersistentState<string | null>(
	'hide-support-banner-until',
	null
);
