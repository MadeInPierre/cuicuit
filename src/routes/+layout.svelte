<script lang="ts">
	import * as Dialog from '$lib/shared/components/ui/dialog';
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
	<Dialog.Root>
		{@render children()}
	</Dialog.Root>
</Tooltip.Provider>
