<script lang="ts">
	import { Button } from '$lib/shared/components/ui/button';
	import { Label } from '$lib/shared/components/ui/label';
	import * as Select from '$lib/shared/components/ui/select/index.js';
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';
	import { cn } from '$lib/utils';
	import { ChevronDown } from '@lucide/svelte';
	import { fade } from 'svelte/transition';

	type Option = {
		value: string;
		label: string;
		icon?: any;
		description?: string;
		disabled?: boolean;
	};

	type Props = {
		title?: string;
		description?: string;
		type?: 'single' | 'multiple';
		values: string[];
		onChange: (values: string[]) => void;
		options: Option[];
		displayColumns?: 1 | 2 | 3;
		initialVisibleCount?: number;
	};

	let {
		title = '',
		description = '',
		type = 'single',
		values,
		onChange,
		options,
		displayColumns = 2,
		initialVisibleCount
	}: Props = $props();

	const isMulti = $derived(type === 'multiple');

	const media = useMedia();

	let isExpanded = $state(false);

	const visibleOptions = $derived(
		initialVisibleCount !== undefined && !isExpanded
			? options.slice(0, initialVisibleCount)
			: options
	);
	const hasMore = $derived(
		initialVisibleCount !== undefined && options.length > initialVisibleCount
	);
	const remainingCount = $derived(
		initialVisibleCount === undefined ? 0 : options.length - initialVisibleCount
	);

	const pillClass = cn(
		'p-3 md:p-2 rounded-xl bg-card shadow-xs border border-border/60 data-[highlighted]:bg-card transition-all',
		'flex items-center gap-2'
	);

	const isSelected = (value: string) => values.includes(value);
</script>

<Select.Root
	{type}
	value={(isMulti ? values : (values[0] ?? undefined)) as never}
	onValueChange={(val: string | string[] | null) => {
		if (isMulti) {
			onChange(Array.isArray(val) ? val : val ? [String(val)] : []);
		} else {
			onChange(val ? [String(val)] : []);
		}
	}}
>
	<div class="space-y-3">
		{#if title || description || hasMore}
			<div class="flex items-center justify-between gap-2">
				<div class="flex-1">
					{#if title}
						<Label class="text-base font-semibold">{title}</Label>
					{/if}
					{#if description}
						<p class="text-sm text-muted-foreground mt-1">{description}</p>
					{/if}
				</div>

				{#if hasMore && (!media.md || isExpanded)}
					<div in:fade={{ duration: 200 }}>
						<Button variant="ghost" size="icon-sm" onclick={() => (isExpanded = !isExpanded)}>
							<ChevronDown
								class={cn('size-4 transition-transform duration-200', isExpanded && 'rotate-180')}
							/>
						</Button>
					</div>
				{/if}
			</div>
		{/if}

		<div
			class="grid gap-3"
			class:grid-cols-2={displayColumns === 2}
			class:grid-cols-3={displayColumns === 3}
		>
			{#each visibleOptions as option (option.value)}
				<Select.Item
					value={option.value}
					label={option.label}
					side="right"
					class={cn(
						pillClass,
						isSelected(option.value) && 'ring-3 ring-primary/60 border-transparent'
					)}
					size="lg"
					disabled={option.disabled}
				>
					{#if typeof option.icon === 'string'}
						<span class="ml-1">{option.icon}</span>
					{:else if option.icon}
						<option.icon class="ml-1 shrink-0 size-5" />
					{/if}

					<div class="grid">
						<span class="text-md">{option.label}</span>
						{#if option.description}
							<span class="text-xs text-muted-foreground">{option.description}</span>
						{/if}
					</div>
				</Select.Item>
			{/each}
		</div>

		{#if hasMore && !isExpanded}
			<Button
				variant="ghost"
				size="sm"
				class="hidden sm:flex w-full text-muted-foreground"
				onclick={() => (isExpanded = true)}
			>
				Show {remainingCount} more
				<ChevronDown class="size-4 ml-1" />
			</Button>
		{/if}
	</div>
</Select.Root>
