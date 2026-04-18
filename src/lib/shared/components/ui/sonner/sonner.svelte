<script lang="ts">
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';
	import { mode } from 'mode-watcher';
	import { Toaster as Sonner, type ToasterProps as SonnerProps } from 'svelte-sonner';

	const media = useMedia();

	let { ...restProps }: SonnerProps = $props();
</script>

<Sonner
	theme={$mode}
	position={media.md ? 'bottom-right' : 'top-center'}
	class="toaster group"
	toastOptions={{
		classes: {
			toast:
				'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
			description: 'group-[.toast]:text-muted-foreground',
			actionButton: 'group-[.toast]:bg-accent group-[.toast]:text-accent-foreground',
			cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground'
		}
	}}
	{...restProps}
/>
