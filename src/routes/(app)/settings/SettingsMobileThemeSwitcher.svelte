<script lang="ts">
	import { Button } from '$lib/shared/components/ui/button';
	import { cn } from '$lib/utils';
	import { Moon, Sun, SunMoon } from '@lucide/svelte';
	import { setMode, userPrefersMode } from 'mode-watcher';

	const options = [
		{ value: 'system' as const, label: 'Device', icon: SunMoon },
		{ value: 'light' as const, label: 'Light', icon: Sun },
		{ value: 'dark' as const, label: 'Dark', icon: Moon }
	];
</script>

<div class="max-w-lg mx-0 rounded-xl bg-card shadow-xs border border-border/60 text-md grid">
	<div class="grid grid-cols-3 gap-1 p-2">
		{#each options as option (option.value)}
			{@const isActive = $userPrefersMode === option.value}
			<Button
				variant="ghost"
				onclick={() => setMode(option.value)}
				class={cn(
					'h-auto flex-col gap-1.5 rounded-lg py-2',
					isActive && 'bg-primary/10 text-primary font-bold'
				)}
				aria-pressed={isActive}
			>
				<option.icon class="size-5" />
				<span class="text-sm">{option.label}</span>
			</Button>
		{/each}
	</div>
</div>
