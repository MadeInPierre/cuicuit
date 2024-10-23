<script lang="ts">
	import '../app.css';
	import Metadata from './Metadata.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/shared/components/ui/sonner';

	let { children } = $props();
</script>

<Metadata />
<ModeWatcher />
<Toaster />

{@render children()}
