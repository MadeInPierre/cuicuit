<script lang="ts">
	import { Button } from '$lib/shared/components/ui/button';
	import { cn } from '$lib/utils';
	import { themeButtonClasses, type SpaceThemeKey } from '../consts';
	import { getActiveSpaceState } from '../state/active-space.svelte';

	interface Props {
		children?: any;
		class?: string;
		[key: string]: any;
	}

	const { children, class: className = '', ...others }: Props = $props();

	const activeSpace = getActiveSpaceState();

	const themeClasses = $derived(
		activeSpace.activeMember
			? themeButtonClasses[activeSpace.activeMember.theme as SpaceThemeKey]
			: ''
	);
</script>

<Button {...others} class={cn(themeClasses, 'dark:text-white', className)}>
	{@render children?.()}
</Button>
