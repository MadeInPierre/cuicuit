<script lang="ts">
	import { Button } from '$lib/shared/components/ui/button';
	import { capitalize, cn } from '$lib/utils';

	type Props = {
		value?: 'familiar' | 'mixed' | 'discover';
		onChange?: (value: 'familiar' | 'mixed' | 'discover') => void;
	};

	let { value = $bindable('mixed'), onChange = () => {} }: Props = $props();
</script>

<div class="h-10 px-[3px] flex items-center gap-0.5 border rounded-md">
	{#snippet button(key: 'familiar' | 'mixed' | 'discover', className: string = '')}
		<Button
			class={cn('h-8 rounded-sm font-normal', value === key && '', className)}
			variant={value === key ? 'secondary' : 'ghost'}
			onclick={() => {
				value = key;
				onChange?.(key);
			}}
		>
			{capitalize(key)}
		</Button>
	{/snippet}

	{@render button('familiar', 'w-20')}
	{@render button('mixed', 'w-20')}
	{@render button('discover', 'w-20')}
</div>
