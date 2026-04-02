<script lang="ts">
	import { Button } from '$lib/shared/components/ui/button';
	import { cn } from '$lib/utils';
	import * as Command from '$lib/shared/components/ui/command/index.js';
	import * as Popover from '$lib/shared/components/ui/popover/index.js';
	import { Check, ChevronDown } from 'lucide-svelte';
	import FilterButton from './FilterButton.svelte';
	import { Label } from '$lib/shared/components/ui/label';

	type Props = {
		title: string;
		icon?: any;
		values?: string[];
		defaultValue: string[];
		onChange?: (values: string[]) => void;
		options?: {
			value: string;
			label: string;
			labelShort?: string;
			icon?: any;
			color?: string;
			bg?: string;
		}[];
		contentWidth?: number;
	};

	let {
		title,
		values = $bindable([]),
		defaultValue = [],
		contentWidth = 200,
		icon = Check,
		options = [],
		onChange = () => {}
	}: Props = $props();

	function formatFilterText(
		keys: string[],
		options: { value: string; label: string; labelShort?: string }[]
	): string {
		function getLabel(key: string) {
			const opt = options.find((o) => o.value === key);
			return opt?.labelShort ?? opt?.label ?? key;
		}
		switch (keys.length) {
			case 0:
				return getLabel(defaultValue[0]) ?? 'Select';
			case 1:
				return getLabel(keys[0]) ?? 'Select';
			case 2: {
				const combined = `${getLabel(keys[0])} & ${getLabel(keys[1])}`;
				return combined.length > 20 ? `${getLabel(keys[0])} +${keys.length - 1}` : combined;
			}
			default:
				return `${getLabel(keys[0])} +${keys.length - 1}`;
		}
	}
</script>

<div class="flex">
	<Popover.Root>
		<Popover.Trigger>
			{#snippet child({ props })}
				<div class="flex">
					<FilterButton
						text={formatFilterText(values.length ? values : defaultValue, options)}
						{icon}
						active={values.length > 0}
						onChange={(checked: boolean) => {
							values = checked ? defaultValue : [];
							onChange?.(values);
						}}
						class="rounded-r-none"
					/>

					<Button
						{...props}
						variant="secondary"
						class={cn(
							'h-7 rounded-r-sm rounded-l-none px-1 font-normal bg-accent dark:text-accent-foreground dark:hover:bg-accent/60 shadow-none',
							values.length > 0 &&
								'bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 text-white'
						)}
					>
						<ChevronDown class="size-3.5" />
					</Button>
				</div>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content class={`w-[${contentWidth || 200}px] p-0`} align="end">
			<Command.Root>
				<!-- <Command.Input placeholder="Hello" /> -->
				<Command.List class="max-h-[400px]">
					<Label class="pl-2">Filter by {title}</Label>
					<Command.Empty>No results found.</Command.Empty>
					<Command.Group>
						{#each options as option}
							{@const isSelected = values.includes(option.value)}
							<Command.Item
								onSelect={() => {
									if (isSelected) {
										values = values.filter((value) => value !== option.value);
									} else {
										values = [...values, option.value];
									}
									onChange?.(values);
								}}
								class={`${option.color} aria-selected:${option.color}`}
							>
								<div
									class={cn(
										'mr-2 flex size-4 items-center justify-center rounded-sm border border-primary',
										isSelected
											? 'bg-primary text-primary-foreground'
											: 'opacity-50 [&_svg]:invisible'
									)}
								>
									<Check class="size-4" />
								</div>
								{#if option.icon}
									{@const Icon = option.icon}
									<Icon />
								{/if}

								<span>{option.label}</span>
							</Command.Item>
						{/each}
					</Command.Group>

					<!-- <Command.Separator />
				{#if values.length > 0}
					<Command.Group>
						<Command.Item
							onSelect={() => {
								values = [];
							}}
							class="justify-center text-center"
						>
							Clear filters
						</Command.Item>
					</Command.Group>
				{:else if values.length === 0}
					<Command.Group>
						<Command.Item
							onSelect={() => {
								values = Array.from(items.map((item) => item.value));
							}}
							class="justify-center text-center"
						>
							Select all
						</Command.Item>
					</Command.Group>
				{/if} -->
				</Command.List>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
</div>
