<script lang="ts">
	import '../app.css';
	import Metadata from './Metadata.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/shared/components/ui/sonner';
	import * as Tooltip from '$lib/shared/components/ui/tooltip';

	let { children } = $props();
</script>

<Metadata />
<ModeWatcher />
<Toaster />

<Tooltip.Provider>
	{@render children()}
</Tooltip.Provider>
