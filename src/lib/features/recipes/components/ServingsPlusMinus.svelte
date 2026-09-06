<script lang="ts">
	import Button from '$lib/shared/components/ui/button/button.svelte';
	import { cn } from '$lib/utils';
	import NumberFlow from '@number-flow/svelte';
	import { Minus, Plus, Trash, User, Users } from '@lucide/svelte';

	type Props = {
		value: number;
		step?: number; // Amount to increment/decrement by. Default is 1.
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
		variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
		allowDelete?: boolean; // If true, show a trash icon on the minus button when counter is 1
		class?: string;

		onChange?: (newValue: number) => void;
		onIncrement?: (newValue: number) => void;
		onDecrement?: (newValue: number) => void;
		onDelete?: () => void;
	};

	let {
		value = $bindable(1),
		step = 1,
		size = 'md',
		variant = 'secondary',
		class: className = '',
		allowDelete = false,

		onChange = () => {},
		onIncrement = () => {},
		onDecrement = () => {},
		onDelete = () => {}
	}: Props = $props();

	const variants = {
		size: {
			xs: {
				mainDiv: 'gap-1',
				counterDiv: 'gap-1',
				counterSpan: 'text-sm',
				counterIcon: 'size-3 mt-0.5',
				buttonDiv: 'size-5',
				buttonIcon: 'size-3'
			},
			sm: {
				mainDiv: 'gap-2',
				counterDiv: 'gap-1',
				counterSpan: 'text-lg',
				counterIcon: 'size-3 mt-1',
				buttonDiv: 'size-6',
				buttonIcon: 'size-3'
			},
			md: {
				mainDiv: 'gap-4',
				counterDiv: 'gap-1.5',
				counterSpan: 'text-2xl',
				counterIcon: 'size-5',
				buttonDiv: 'size-8',
				buttonIcon: 'size-4'
			},
			lg: {
				mainDiv: 'gap-4',
				counterDiv: 'gap-2',
				counterSpan: 'text-4xl',
				counterIcon: 'size-6 mt-1',
				buttonDiv: 'size-10',
				buttonIcon: 'size-5'
			},
			xl: {
				mainDiv: 'gap-4 h-12',
				counterDiv: 'gap-2',
				counterSpan: 'text-5xl',
				counterIcon: 'size-7 mt-1.5',
				buttonDiv: 'size-12',
				buttonIcon: 'size-6'
			}
		}
	};

	const currentVariant = $derived(variants.size[size]);

	function onButtonIncrement() {
		value = value + step;
		onChange?.(value);
		onIncrement?.(value);
	}

	function onButtonDecrement() {
		if (value <= step) {
			if (allowDelete) onDelete?.();
		} else {
			value = value - step;
			onChange?.(value);
			onDecrement?.(value);
		}
	}
</script>

{#snippet button(
	Icon: any,
	onclick: () => void,
	disabled: boolean = false,
	showDelete: boolean = false
)}
	<Button
		{variant}
		size="icon"
		class={cn('rounded-full', currentVariant.buttonDiv)}
		{onclick}
		disabled={disabled && !showDelete}
		aria-label={showDelete ? 'Delete' : 'Change servings'}
	>
		{#if showDelete}
			<Trash class={cn('text-destructive', currentVariant.buttonIcon)} />
		{:else}
			<Icon class={currentVariant.buttonIcon} />
		{/if}
	</Button>
{/snippet}

<div class={cn('flex items-center', currentVariant.mainDiv, className)}>
	{@render button(Minus, onButtonDecrement, value <= 1, allowDelete && value <= 1)}

	<div class={cn('flex', currentVariant.counterDiv)}>
		<NumberFlow
			{value}
			format={{}}
			class={cn('font-semibold tracking-tight select-none', currentVariant.counterSpan)}
		/>

		{#if value === 1}
			<User class={currentVariant.counterIcon} />
		{:else}
			<Users class={currentVariant.counterIcon} />
		{/if}
	</div>

	{@render button(Plus, onButtonIncrement)}
</div>
