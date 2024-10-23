<script lang="ts">
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';

	interface Props {
		href: string;
		open: boolean;
		class?: string;
		children: any;
	}

	let { href, open = $bindable(), class: className, children, ...restProps }: Props = $props();
</script>

<a
	{href}
	class={cn($page.url.pathname === href ? 'text-foreground' : 'text-foreground/60', className)}
	onclick={() => (open = false)}
	{...restProps}
>
	{@render children()}
</a>
