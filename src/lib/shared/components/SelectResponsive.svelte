<script lang="ts">
	import * as Drawer from '$lib/shared/components/ui/drawer/index.js';
	import * as Select from '$lib/shared/components/ui/select/index.js';
	import { cn } from '$lib/utils';
	import { CheckCheck, Clock, Globe, HandPlatter, Sparkle } from 'lucide-svelte';
	import { useMedia } from '../hooks/use-media.svelte';
	import { Button } from './ui/button';
	import { Label } from './ui/label';

	const defaultOptions = [
		{
			value: 'course',
			label: 'Course',
			description: 'Appetizer, main course, dessert, ...',
			icon: HandPlatter
		},
		{
			value: 'timeOfDay',
			label: 'Time of day',
			description: 'Breakfast, lunch, snack, ...',
			icon: Clock
		},
		{
			value: 'cuisine',
			label: 'Cuisine',
			description: 'Italian, Chinese, Mexican, ...',
			icon: Globe
		},
		{
			value: 'recommended',
			label: 'Recommended',
			// description: 'A mix of your favorites, best picks, and more',
			description: 'Coming soon: dynamic recommendations',
			icon: Sparkle,
			disabled: true // For coming soon features
		},
		{
			value: 'cookable',
			label: 'Cookability',
			// description: 'Ready to cook, change of plans, ...',
			description: 'Coming soon: pantry-aware recommendations',
			icon: CheckCheck,
			disabled: true // For coming soon features
		}
	];

	type Props = {
		title: string;
		description?: string;
		values?: string[];
		open?: boolean;
		onChange?: (values: string[]) => void;
		options?: {
			value: string;
			label: string;
			description?: string;
			icon?: any;
			disabled?: boolean;
		}[];
		emptyLabel?: string;
		closeOnSelect?: boolean;
		displayColumns?: 1 | 2 | 3;
		align?: 'start' | 'center' | 'end';
		showReset?: boolean;
	};

	let {
		title,
		description = '',
		values = $bindable(['timeOfDay']),
		emptyLabel = '',
		open = $bindable(false),
		onChange = () => {},
		options = defaultOptions,
		closeOnSelect = false,
		displayColumns = 1,
		align = 'end',
		showReset = false
	}: Props = $props();

	const media = useMedia();

	const TriggerIcon = $derived(options.find((f) => values?.[0] === f.value)?.icon ?? undefined);

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
				return emptyLabel ?? 'Select';
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

<Select.Root
	type="multiple"
	name="recipeGroupBy"
	bind:value={values}
	onValueChange={(val) => {
		onChange?.(val);
		if (closeOnSelect) open = false;
	}}
	bind:open
>
	<Drawer.Root bind:open shouldScaleBackground={false}>
		<Drawer.Trigger>
			{#snippet child()}
				<Select.Trigger
					class="w-auto h-min px-2 py-0.5 text-md border-0 bg-muted flex items-center gap-1.5"
				>
					{#if typeof TriggerIcon === 'string'}
						<span>{TriggerIcon}</span>
					{:else}
						<TriggerIcon class="size-4"></TriggerIcon>
					{/if}

					<span>{formatFilterText(values, options)}</span>
				</Select.Trigger>
			{/snippet}
		</Drawer.Trigger>

		{#if media.md}
			<Select.Content {align}>
				<Select.Group>
					<Label>{title}</Label>

					{#each options as option (option.value)}
						<Select.Item
							value={option.value}
							label={option.label}
							side="right"
							disabled={option.disabled}
						>
							<div class="flex items-center mr-4 gap-2">
								{#if typeof option.icon === 'string'}
									<span>{option.icon}</span>
								{:else}
									<option.icon class="mr-3 size-4" />
								{/if}

								<div class="grid">
									<span>{option.label}</span>
									<span class="text-xs text-muted-foreground">{option.description}</span>
								</div>
							</div>
						</Select.Item>
					{/each}
				</Select.Group>
			</Select.Content>
		{:else}
			<Drawer.Content class="max-h-[70%]">
				<Drawer.Header class="text-start relative">
					<Drawer.Title>{title}</Drawer.Title>
					{#if description}
						<Drawer.Description>{description}</Drawer.Description>
					{/if}

					{#if showReset}
						<Button
							variant="link"
							class="absolute top-1/2 -translate-y-1/2 right-2"
							tabindex={-1}
							onclick={() => {
								onChange?.([]);
								open = false;
							}}
						>
							Reset
						</Button>
					{/if}
				</Drawer.Header>

				<div
					class="grid gap-3 px-6 mb-6"
					class:grid-cols-2={displayColumns === 2}
					class:grid-cols-3={displayColumns === 3}
				>
					{#each options as option (option.value)}
						<Select.Item
							value={option.value}
							label={option.label}
							side="right"
							class={cn(
								'p-3 rounded-xl bg-white shadow-xs border border-border/60 data-[highlighted]:bg-white transition-all',
								values.includes(option.value) && 'ring-3 ring-primary/60 border-transparent'
							)}
							size="lg"
							disabled={option.disabled}
						>
							<div class="px-2 flex items-center gap-2">
								{#if typeof option.icon === 'string'}
									<span>{option.icon}</span>
								{:else}
									<option.icon class="mr-3 size-5" />
								{/if}

								<div class="grid">
									<span class="text-md">{option.label}</span>
									<span class="text-xs text-muted-foreground">{option.description}</span>
								</div>
							</div>
						</Select.Item>
					{/each}
				</div>

				<!-- <Drawer.Footer class="pt-2">
					<Drawer.Close class={buttonVariants({ variant: 'outline' })}>Cancel</Drawer.Close>
				</Drawer.Footer> -->
			</Drawer.Content>
		{/if}
	</Drawer.Root>
</Select.Root>
