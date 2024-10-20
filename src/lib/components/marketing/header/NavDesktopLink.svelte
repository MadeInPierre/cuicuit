<script lang="ts">
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';

	interface Props {
		href: string;
		startsWith?: boolean;
		class?: string;
		startPath: string;
		children: any;
	}

	const {
		href,
		startsWith = false,
		startPath,
		class: className,
		children,
		...restProps
	}: Props = $props();

	let _startPath = $derived(startPath ? startPath : href);
	let isActive = $derived(
		startsWith ? $page.url.pathname.startsWith(_startPath) : $page.url.pathname === href
	);
</script>

<a
	{href}
	class={cn(
		'transition-colors hover:text-foreground/80',
		isActive ? 'text-foreground' : 'text-foreground/60',
		className
	)}
	{...restProps}
>
	{@render children()}
</a>
