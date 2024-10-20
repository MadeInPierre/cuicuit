<script lang="ts">
	import { cn } from '$lib/utils.js';

	interface Props {
		balanced?: boolean;
		class?: string;
		children: any;
	}

	const { balanced = true, class: className, children, ...restProps }: Props = $props();
</script>

<p
	class={cn(
		'text-md max-w-[750px] text-center text-muted-foreground sm:text-lg md:text-xl',
		balanced && 'text-balance',
		className
	)}
	{...restProps}
>
	{@render children()}
</p>
