<script lang="ts">
	import { Button } from '$lib/shared/components/ui/button';
	import { capitalize, cn } from '$lib/utils';

	type Props = {
		value?: 'familiar' | 'mixed' | 'discover';
		onChange?: (value: 'familiar' | 'mixed' | 'discover') => void;
		class?: string;
	};

	let { value = $bindable('familiar'), onChange = () => {}, class: className = '' }: Props = $props();
</script>

<div class={cn("h-9 px-[3px] flex items-center gap-0.5 border rounded-md", className)}>
	{#snippet button(key: 'familiar' | 'mixed' | 'discover', className: string = '')}
		<Button
			class={cn('h-7 rounded-sm font-normal', value === key && '', className)}
			variant={value === key ? 'secondary' : 'ghost'}
			onclick={() => {
				value = key;
				onChange?.(key);
			}}
		>
			{capitalize(key)}
		</Button>
	{/snippet}

	{@render button('familiar', 'w-1/3')}
	{@render button('mixed', 'w-1/3 hidden xl:flex')}
	{@render button('discover', 'w-1/3')}
</div>
