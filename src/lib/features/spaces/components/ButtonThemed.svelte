<script lang="ts">
	import { Button } from '$lib/shared/components/ui/button';
	import { cn } from '$lib/utils';
	import { themeButtonClasses } from '../consts';
	import { getActiveSpaceState } from '../state/active-space.svelte';

	interface Props {
		children?: any;
		class?: string;
		onclick?: () => void;
		[key: string]: any;
	}

	const { children, class: className = '', onclick = () => {}, ...others }: Props = $props();

	const activeSpace = getActiveSpaceState();
	const themeClasses = $derived(
		activeSpace.userHeader ? themeButtonClasses[activeSpace.userHeader.theme] : ''
	);
</script>

<Button {...others} class={cn(themeClasses, className)} on:click={() => onclick()}>
	{@render children?.()}
</Button>
