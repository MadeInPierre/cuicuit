<script lang="ts">
	import { cn } from '$lib/utils.js';

	interface Props {
		class?: string;
		children: any;
	}

	const { class: className, children, ...restProps }: Props = $props();
</script>

<h1
	class={cn(
		'text-center text-4xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl lg:leading-[1.1]',
		className
	)}
	{...restProps}
>
	{@render children()}
</h1>
