<script lang="ts">
	import { cn } from '$lib/utils';
	import Loader2 from '@lucide/svelte/icons/loader-circle';
	import {
		spaceIcons,
		themeButtonClasses,
		themeSoftClasses,
		type SpaceIconKey,
		type SpaceThemeKey
	} from '../consts';
	import { getActiveSpaceState } from '../state/active-space.svelte';

	interface Props {
		class?: string;
		iconClass?: string;
		variant?: 'default' | 'muted';
	}

	let { class: className = '', iconClass = '', variant = 'default' }: Props = $props();

	const activeSpace = getActiveSpaceState();
	const Icon = $derived(spaceIcons[activeSpace.activeSpace?.icon as SpaceIconKey] || Loader2);
	const themeKey = $derived(activeSpace.activeMember?.theme as SpaceThemeKey | undefined);
	const themeClass = $derived(
		variant === 'muted'
			? (themeKey && themeSoftClasses[themeKey]) || 'bg-muted text-muted-foreground'
			: (themeKey && themeButtonClasses[themeKey]) ||
					'bg-sidebar-primary text-sidebar-primary-foreground'
	);
</script>

<div
	class={cn(
		'flex aspect-square size-8 items-center justify-center rounded-lg transition-colors',
		themeClass,
		className
	)}
>
	<Icon class={cn('size-4', !activeSpace.id && 'animate-spin', iconClass)} />
</div>
