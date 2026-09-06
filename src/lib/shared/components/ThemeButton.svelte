<script lang="ts">
	import { Button } from '$lib/shared/components/ui/button';
	import { cn } from '$lib/utils';
	import { setMode, userPrefersMode } from 'mode-watcher';
	import { toast } from 'svelte-sonner';

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
		label?: string;
		class?: string;
	}

	const { label = undefined, class: className }: Props = $props();
</script>

<Button
	onclick={() => setMode($userPrefersMode === 'dark' ? 'light' : 'dark')}
	variant="ghost"
	size="icon-sm"
	class={cn('font-normal flex items-center justify-center', label && 'justify-start', className)}
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="size-4.5"
	>
		<path stroke="none" d="M0 0h24v24H0z" fill="none" />
		<path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
		<path d="M12 3l0 18" />
		<path d="M12 9l4.65 -4.65" />
		<path d="M12 14.3l7.37 -7.37" />
		<path d="M12 19.6l8.85 -8.85" />
	</svg>
	<span class="sr-only">{$userPrefersMode === 'dark' ? 'Light mode' : 'Dark mode'}</span>

	{#if label}
		<span>{label}</span>
	{/if}
</Button>

<!-- {#snippet button(
	ModeIcon: any,
	label: string,
	code: 'light' | 'dark' | 'system',
	isActive: boolean
)}
	<div class={cn(!isActive && !keepOpen && 'group-hover/themebutton:block hidden')}>
		<Tooltip.Provider>
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button
						onclick={() => setMode(code)}
						variant="ghost"
						class={cn(
							'size-7 px-0 rounded-full text-muted-foreground hover:text-black dark:hover:text-white',
							isActive && 'text-black dark:text-white group-hover/themebutton:border'
						)}
					>
						<ModeIcon class="size-3.5"></ModeIcon>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="size-4.5"
						>
							<path stroke="none" d="M0 0h24v24H0z" fill="none" />
							<path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
							<path d="M12 3l0 18" />
							<path d="M12 9l4.65 -4.65" />
							<path d="M12 14.3l7.37 -7.37" />
							<path d="M12 19.6l8.85 -8.85" />
						</svg>
						<span class="sr-only">{label}</span>
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content side={tooltipSide}>
					<span>{label}</span>
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
	</div>
{/snippet}

<div class={cn('flex rounded-full group/themebutton', className)}>
	{@render button(SunMoon, 'Follow device', 'system', $userPrefersMode === 'system')}
	{@render button(Moon, 'Dark', 'dark', $userPrefersMode === 'dark')}
	{@render button(Sun, 'Light', 'light', $userPrefersMode === 'light')}
</div> -->
