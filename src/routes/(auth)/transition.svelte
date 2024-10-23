<script lang="ts">
	import { fly } from 'svelte/transition';

	interface Props {
		url: string;
		direction: 'left' | 'right';
		children?: import('svelte').Snippet;
	}

	let { url, direction, children }: Props = $props();
</script>

{#key url}
	<div
		out:fly={{ x: direction == 'right' ? -5 : 5, duration: 250 }}
		in:fly={{ x: direction == 'right' ? 5 : -5, duration: 250, delay: 250 }}
		class="absolute w-full space-y-6 p-0 sm:w-[350px]"
	>
		{@render children?.()}
	</div>
{/key}
