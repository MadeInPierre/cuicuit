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
		class="absolute w-full space-y-3 p-6 bg-card rounded-xl drop-shadow-lg"
	>
		{@render children?.()}
	</div>
{/key}
