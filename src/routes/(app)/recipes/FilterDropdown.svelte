<script lang="ts">
	import * as Select from '$lib/shared/components/ui/select/index.js';
	import { CheckCheck, Clock, Globe, HandPlatter, Sparkle } from 'lucide-svelte';

	const options = [
		{
			value: 'recommended',
			label: 'Recommended',
			description: "Let Cuicuit decide what's best",
			icon: Sparkle
		},
		{
			value: 'cookable',
			label: 'Cookable state',
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

	let { value = $bindable('timeOfDay') } = $props();

	const triggerContent = $derived(options.find((f) => f.value === value)?.label ?? 'recommended');
</script>

<Select.Root type="single" name="favoriteFruit" bind:value>
	<Select.Trigger class="w-auto h-min px-2 py-0.5 text-md border-0 bg-muted">
		<span class="mr-1.5">{triggerContent.toLowerCase()}</span>
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
