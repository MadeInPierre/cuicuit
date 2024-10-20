<script lang="ts">
	import '../app.css';
	import Metadata from './Metadata.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner';
	import ThemeButton from '$lib/components/common/ThemeButton.svelte';

	let { children } = $props();
</script>

<Metadata />
<ModeWatcher />
<Toaster />

{@render children()}
