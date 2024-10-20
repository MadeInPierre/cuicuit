<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { SunMoon, Sun, Moon } from 'lucide-svelte';
	import { setMode, userPrefersMode } from 'mode-watcher';
	import { toast } from 'svelte-sonner';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	function switchMode() {
		if ($userPrefersMode === 'dark') {
			setMode('light');
			toast.success('Light mode', { description: 'Bright as the sun! 😎' });
		} else if ($userPrefersMode === 'light') {
			setMode('system');
			toast.success('System mode', { description: 'Follows your device theme 👀' });
		} else {
			setMode('dark');
			toast.success('Dark mode', { description: 'For your beautiful, protected eyes 🌛' });
		}
	}
</script>

<Tooltip.Root>
	<Tooltip.Trigger asChild let:builder>
		<Button builders={[builder]} on:click={switchMode} variant="ghost" class="h-9 w-9 px-0">
			{#if $userPrefersMode === 'system'}
				<SunMoon class="h-[1.2rem] w-[1.2rem] transition-all" />
			{:else if $userPrefersMode === 'dark'}
				<Moon class="h-[1.2rem] w-[1.2rem] rotate-0 transition-all" />
			{:else}
				<Sun class="h-[1.2rem] w-[1.2rem] rotate-0 transition-all" />
			{/if}

			<span class="sr-only">Toggle theme</span>
		</Button>
	</Tooltip.Trigger>

	<Tooltip.Content>
		{#if $userPrefersMode === 'system'}
			<span>Follows your device</span>
		{:else if $userPrefersMode === 'dark'}
			<span>Dark</span>
		{:else}
			<span>Light</span>
		{/if}
	</Tooltip.Content>
</Tooltip.Root>
