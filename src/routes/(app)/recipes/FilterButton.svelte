<script lang="ts">
	import { Button } from '$lib/shared/components/ui/button';
	import { cn } from '$lib/utils';
	import { Check } from 'lucide-svelte';
	import { slide } from 'svelte/transition';

	type Props = {
		text?: string;
		icon?: any;
		primary?: boolean;
		active?: boolean;
	};

	let { text = '', icon: Icon = Check, primary = false, active = false }: Props = $props();

	let isActive = $state(active);
</script>

<Button
	variant={primary ? 'default' : 'secondary'}
	class={cn(
		'h-7 flex items-center gap-1.5 text-sm rounded-sm px-2 font-normal',
		!primary && 'bg-muted text-primary',
		!primary && isActive && 'bg-muted-foreground/25 text-primary hover:bg-muted-foreground/20 dark:bg-slate-500 dark:hover:bg-slate-600'
	)}
	onclick={() => {
		isActive = !isActive;
	}}
>
	{#if primary || isActive}
		<div transition:slide={{ axis: 'x', duration: 75 }}>
			<Icon class="size-3.5" />
		</div>
	{/if}

	{#if text}
		<span>{text}</span>
	{/if}
</Button>
