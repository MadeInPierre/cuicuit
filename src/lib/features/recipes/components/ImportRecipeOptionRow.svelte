<script lang="ts">
	import { cn } from '$lib/utils';
	import { ChevronRight } from '@lucide/svelte';
	import type { Component } from 'svelte';

	type Props = {
		icon: Component;
		title: string;
		description?: string;
		/** Small trailing badge (e.g. cost, "Free", "Soon"). */
		badge?: string;
		onclick?: () => void;
		disabled?: boolean;
	};

	let {
		icon: Icon,
		title,
		description = '',
		badge = '',
		onclick,
		disabled = false
	}: Props = $props();
</script>

<button
	{onclick}
	class={cn(
		'flex w-full items-center gap-3 rounded-xl border border-border/60 bg-white p-3 text-left shadow-xs transition-colors active:bg-muted/60 dark:bg-card',
		disabled && 'bg-muted border-none'
	)}
>
	<Icon class="size-5 shrink-0 text-foreground" />

	<span class="grid min-w-0 flex-1">
		<span class="flex items-center gap-2 text-md font-medium">
			{title}
		</span>
		{#if description}
			<span class="truncate text-xs text-muted-foreground">{description}</span>
		{/if}
	</span>

	{#if badge}
		<span
			class="rounded-full bg-lime-100 px-2 py-0.5 text-xs font-medium text-lime-700 dark:bg-lime-900/40 dark:text-lime-300"
		>
			{badge}
		</span>
	{/if}
	<ChevronRight class="size-4 shrink-0 text-muted-foreground" />
</button>
