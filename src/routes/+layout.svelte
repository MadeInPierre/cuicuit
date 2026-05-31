<script lang="ts">
	import { Toaster } from '$lib/shared/components/ui/sonner';
	import * as Tooltip from '$lib/shared/components/ui/tooltip';
	import { ModeWatcher } from 'mode-watcher';
	import '../app.css';
	import Metadata from './Metadata.svelte';

	let { children } = $props();
</script>

<Metadata />
<ModeWatcher />
<Toaster />

<Tooltip.Provider>
	{@render children()}
</Tooltip.Provider>
