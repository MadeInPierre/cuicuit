<script lang="ts">
	import { Button } from '$lib/shared/components/ui/button';
	import LaptopMinimal from 'lucide-svelte/icons/laptop-minimal';
	import Moon from 'lucide-svelte/icons/moon';
	import Sun from 'lucide-svelte/icons/sun';
	import SunMoon from 'lucide-svelte/icons/sun-moon';
	import { setMode, userPrefersMode } from 'mode-watcher';
	import { toast } from 'svelte-sonner';
	import * as Tooltip from '$lib/shared/components/ui/tooltip/index.js';
	import { cn } from '$lib/utils';

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

	interface Props {
		class?: string;
	}

	const { class: className }: Props = $props();
</script>

{#snippet button(
	ModeIcon: any,
	label: string,
	code: 'light' | 'dark' | 'system',
	isActive: boolean
)}
	<div class={!isActive ? 'group-hover:block hidden' : ''}>
		<Tooltip.Provider>
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button
						onclick={() => setMode(code)}
						variant="ghost"
						class={cn(
							'size-7 px-0 rounded-full text-muted-foreground hover:text-black dark:hover:text-white',
							isActive && 'text-black dark:text-white border'
						)}
					>
						<ModeIcon class="size-3.5"></ModeIcon>
						<span class="sr-only">{label}</span>
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content side="right">
					<span>{label}</span>
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
	</div>
{/snippet}

<div class={cn('flex rounded-full border group', className)}>
	{@render button(SunMoon, 'Follow device', 'system', $userPrefersMode === 'system')}
	{@render button(Moon, 'Dark', 'dark', $userPrefersMode === 'dark')}
	{@render button(Sun, 'Light', 'light', $userPrefersMode === 'light')}
</div>
