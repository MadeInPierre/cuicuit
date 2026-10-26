<script lang="ts">
	import { cn } from '$lib/utils';
	import { Button } from './ui/button';

	type PillOption = { value: string; label: string };
	type PillGroup = { label: string; options: readonly PillOption[] };

	type Props = {
		options?: readonly PillOption[];
		groups?: readonly PillGroup[];
		value?: string;
		values?: string[];
		multiple?: boolean;
		disabled?: boolean;
		class?: string;
	};

	let {
		options = [],
		groups = [],
		value = $bindable(''),
		values = $bindable([]),
		multiple = false,
		disabled = false,
		class: className
	}: Props = $props();

	function isSelected(optionValue: string) {
		return multiple ? values.includes(optionValue) : value === optionValue;
	}

	function toggle(optionValue: string) {
		if (disabled) return;
		if (multiple) {
			values = values.includes(optionValue)
				? values.filter((item) => item !== optionValue)
				: [...values, optionValue];
		} else {
			value = optionValue;
		}
	}
</script>

{#snippet pills(items: readonly PillOption[])}
	<div class="flex flex-wrap gap-1.5">
		{#each items as option (option.value)}
			<Button
				type="button"
				size="sm"
				variant={isSelected(option.value) ? 'default' : 'secondary'}
				class="h-5 text-xs sm:text-[11px] border-none"
				aria-pressed={isSelected(option.value)}
				{disabled}
				onclick={() => toggle(option.value)}
			>
				{option.label}
			</Button>
		{/each}
	</div>
{/snippet}

<div class={cn('grid gap-2', className)}>
	{#if groups.length > 0}
		{#each groups as group (group.label)}
			<div class="grid gap-1">
				<p class="mt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
					{group.label}
				</p>
				{@render pills(group.options)}
			</div>
		{/each}
	{:else}
		{@render pills(options)}
	{/if}
</div>
