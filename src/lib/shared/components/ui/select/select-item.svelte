<script lang="ts">
	import { cn } from '$lib/utils.js';
	import Check from '@lucide/svelte/icons/check';
	import { Select as SelectPrimitive, type WithoutChild } from 'bits-ui';

	let {
		ref = $bindable(null),
		class: className,
		value,
		label,
		children: childrenProp,
		side = 'left', // 'left' or 'right'
		size = 'md',
		...restProps
	}: WithoutChild<SelectPrimitive.ItemProps> & {
		side?: 'left' | 'right';
		size?: 'sm' | 'md' | 'lg';
	} = $props();
</script>

<SelectPrimitive.Item
	bind:ref
	{value}
	class={cn(
		'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
		side === 'right' ? 'pl-2 pr-8' : '',
		className
	)}
	{...restProps}
>
	{#snippet children({ selected, highlighted })}
		{#if side === 'left'}
			<span class="absolute left-2 flex size-3.5 items-center justify-center">
				{#if selected}
					<Check class="size-4" />
				{/if}
			</span>
		{:else}
			<span
				class={cn(
					'absolute right-2 flex size-3.5 items-center justify-center',
					size === 'lg' && 'right-4 size-4.5'
				)}
			>
				{#if selected}
					<Check class={cn('size-4.5', size === 'lg' && 'text-primary')} />
				{/if}
			</span>
		{/if}
		{#if childrenProp}
			{@render childrenProp({ selected, highlighted })}
		{:else}
			{label || value}
		{/if}
	{/snippet}
</SelectPrimitive.Item>
