<script lang="ts" module>
	export type UISectionHeader = {
		title: string;
		subtitle?: string;
		icon: any;
		classes?: string;
	};
</script>

<script lang="ts">
	import { cn } from '$lib/utils';

	type Props = {
		size?: 'sm' | 'md';
		header: UISectionHeader;
		class?: string;
	};
	const { size = 'md', header, class: className = '' }: Props = $props();
</script>

<div class={cn('flex items-center gap-4', className)}>
	<div
		class={cn(
			'w-12 aspect-square bg-muted rounded-md flex items-center justify-center',
			size === 'sm' && 'size-10',
			header.classes || ''
		)}
	>
		{#if typeof header.icon === 'string'}
			<span class="text-xl">{header.icon}</span>
		{:else}
			<header.icon class={cn('size-6 text-muted-foreground', header.classes || '')} />
		{/if}
	</div>

	<div class="grid">
		<h2 class="text-lg font-bold tracking-tight">{header.title}</h2>
		{#if size === 'md' && header.subtitle}
			<p class="text-muted-foreground text-sm">{header.subtitle}</p>
		{/if}
	</div>
</div>
