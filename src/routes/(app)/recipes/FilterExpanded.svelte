<script lang="ts">
	import * as Select from '$lib/shared/components/ui/select/index.js';
	import { cn } from '$lib/utils';
	import { Label } from '$lib/shared/components/ui/label';
	import { Button } from '$lib/shared/components/ui/button';
	import { ChevronDown, ChevronRight } from 'lucide-svelte';
	import { fade } from 'svelte/transition';
	import { ChevronUp } from '@lucide/svelte';
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';

	type Props = {
		title: string;
		description?: string;
		values?: string[];
		onChange?: (values: string[]) => void;
		options?: {
			value: string;
			label: string;
			icon?: any;
			description?: string;
			disabled?: boolean;
		}[];
		displayColumns?: 1 | 2 | 3;
		initialVisibleCount?: number;
	};

	let {
		title,
		description = '',
		values = $bindable([]),
		options = [],
		onChange = () => {},
		displayColumns = 2,
		initialVisibleCount = 4
	}: Props = $props();

	let isExpanded = $state(false);

	const visibleOptions = $derived(isExpanded ? options : options.slice(0, initialVisibleCount));
	const hasMore = $derived(options.length > initialVisibleCount);
	const remainingCount = $derived(options.length - initialVisibleCount);
	const media = useMedia();
</script>

<Select.Root
	type="multiple"
	bind:value={values}
	onValueChange={(val) => {
		onChange?.(val);
	}}
>
	<div class="space-y-3">
		<div class="flex items-center justify-between gap-2">
			<div class="flex-1">
				<Label class="text-base font-semibold">{title}</Label>
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
						'p-3 md:p-2 rounded-xl bg-white shadow-xs border border-border/60 data-[highlighted]:bg-white transition-all',
						values.includes(option.value) && 'ring-3 ring-primary/60 border-transparent'
					)}
					size="lg"
					disabled={option.disabled}
				>
					<div class="px-2 flex items-center gap-2">
						{#if typeof option.icon === 'string'}
							<span class="text-2xl">{option.icon}</span>
						{:else if option.icon}
							<option.icon class="mr-3 size-5 flex-shrink-0" />
						{/if}

						<div class="grid">
							<span class="text-md">{option.label}</span>
							{#if option.description}
								<span class="text-xs text-muted-foreground">{option.description}</span>
							{/if}
						</div>
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
