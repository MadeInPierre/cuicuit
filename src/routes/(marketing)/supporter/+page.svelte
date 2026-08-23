<script>
	import { browser } from '$app/environment';
	import SupportWall from './SupportWall.svelte';

	const { data } = $props();

	$effect(() => {
		if (browser) {
			// If we were brought by a previous intent, clear it
			const navigateIntent = localStorage.getItem('navigate-intent');
			if (navigateIntent === 'supporter-page') {
				localStorage.removeItem('navigate-intent');
			}
		}
	});
</script>

<div class="mx-auto max-w-250 overflow-hidden bg-background">
	<SupportWall email={data.claims?.email || null} />
</div>
