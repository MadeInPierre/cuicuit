<script lang="ts">
	import * as Select from '$lib/shared/components/ui/select/index.js';
	import { CheckCheck, Clock, Globe, HandPlatter, Sparkle } from '@lucide/svelte';

	const defaultOptions = [
		{
			value: 'recommended',
			label: 'Recommended',
			description: 'Best picks for you',
			icon: Sparkle
		},
		{
			value: 'cookable',
			label: 'Cookability',
			description: 'Ready to cook, change of plans, ...',
			icon: CheckCheck
		},
		{
			value: 'timeOfDay',
			label: 'Time of day',
			description: 'Breakfast, lunch, snack, ...',
			icon: Clock
		},
		{
			value: 'course',
			label: 'Course',
			description: 'Appetizer, main course, dessert, ...',
			icon: HandPlatter
		},
		{
			value: 'cuisine',
			label: 'Cuisine',
			description: 'Italian, Chinese, Mexican, ...',
			icon: Globe
		}
	];

	type Props = {
		value?: string;
		onChange?: (value: string) => void;
		options?: {
			value: string;
			label: string;
			description: string;
			icon: typeof CheckCheck;
		}[];
	};

	let {
		value = $bindable('timeOfDay'),
		onChange = () => {},
		options = defaultOptions
	}: Props = $props();

	const triggerLabel = $derived(
		options.find((f) => f.value === value)?.label ?? defaultOptions[0].label
	);

	const TriggerIcon = $derived(
		options.find((f) => f.value === value)?.icon ?? defaultOptions[0].icon
	);
</script>

<Select.Root
	type="single"
	name="recipeGroupBy"
	bind:value
	onValueChange={(val) => {
		onChange?.(val);
	}}
>
	<Select.Trigger class="w-auto h-min px-2 py-0.5 text-md border-0 bg-muted">
		<TriggerIcon class="mr-1.5 size-4"></TriggerIcon>
		<span class="mr-1.5">{triggerLabel}</span>
	</Select.Trigger>
	<Select.Content align="start">
		<Select.Group>
			<!-- <Label >Group recipes by...</Label> -->
			{#each options as fruit (fruit.value)}
				<Select.Item value={fruit.value} label={fruit.label} side="right">
					<div class="flex items-center mr-4">
						<fruit.icon class="mr-3 size-4" />
						<div class="grid">
							<span>{fruit.label}</span>
							<span class="text-xs text-muted-foreground">{fruit.description}</span>
						</div>
					</div>
				</Select.Item>
			{/each}
		</Select.Group>
	</Select.Content>
</Select.Root>
