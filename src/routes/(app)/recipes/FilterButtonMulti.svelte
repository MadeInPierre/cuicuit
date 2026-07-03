<script lang="ts">
	import SelectResponsive from '$lib/shared/components/SelectResponsive.svelte';

	type Props = {
		title: string;
		description?: string;
		values?: string[];
		emptyLabel?: string;
		// contentWidth?: number;
		// icon?: any;
		onChange?: (values: string[]) => void;
		options?: {
			value: string;
			label: string;
			labelShort?: string;
			icon?: any;
			color?: string;
			bg?: string;
		}[];
	};

	let {
		title,
		description = '',
		values = $bindable([]),
		emptyLabel = '',
		// contentWidth = 200,
		// icon = Check,
		options = [],
		onChange = () => {}
	}: Props = $props();
</script>

<SelectResponsive
	{title}
	{description}
	bind:values
	{options}
	{emptyLabel}
	{onChange}
	displayColumns={2}
	showReset={values?.length > 0}
/>

<!-- <div class="flex">
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
							'h-7 w-7 rounded-r-sm rounded-l-none font-normal bg-accent dark:text-accent-foreground dark:hover:bg-accent/60 shadow-none',
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
				</Command.List>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
</div> -->
