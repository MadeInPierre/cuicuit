<script lang="ts">
	import * as Drawer from '$lib/shared/components/ui/drawer/index.js';
	import * as Select from '$lib/shared/components/ui/select/index.js';
	import { cn } from '$lib/utils';
	import { CheckCheck, Clock, Globe, HandPlatter, Sparkle } from 'lucide-svelte';
	import { useMedia } from '../hooks/use-media.svelte';

	const defaultOptions = [
		{
			value: 'course',
			label: 'Course',
			description: 'Appetizer, main course, dessert, ...',
			icon: HandPlatter
		},
		{
			value: 'recommended',
			label: 'Recommended',
			description: 'A mix of your favorites, best picks, and more',
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
			value: 'cuisine',
			label: 'Cuisine',
			description: 'Italian, Chinese, Mexican, ...',
			icon: Globe
		}
	];

	type Props = {
		title: string;
		description?: string;
		value?: string;
		open?: boolean;
		onChange?: (value: string) => void;
		options?: {
			value: string;
			label: string;
			description: string;
			icon: typeof CheckCheck;
		}[];
	};

	let {
		title,
		description = '',
		value = $bindable('timeOfDay'),
		open = $bindable(false),
		onChange = () => {},
		options = defaultOptions
	}: Props = $props();

	const media = useMedia();

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
	bind:open
>
	<Drawer.Root bind:open shouldScaleBackground={false}>
		<Drawer.Trigger>
			{#snippet child()}
				<Select.Trigger class="w-auto h-min px-2 py-0.5 text-md border-0 bg-muted">
					<TriggerIcon class="mr-1.5 size-4"></TriggerIcon>
					<span class="mr-1.5">{triggerLabel}</span>
				</Select.Trigger>
			{/snippet}
		</Drawer.Trigger>

		{#if media.md}
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
		{:else}
			<Drawer.Content>
				<Drawer.Header class="text-start">
					<Drawer.Title>{title}</Drawer.Title>
					{#if description}
						<Drawer.Description>{description}</Drawer.Description>
					{/if}
				</Drawer.Header>

				<div class="grid gap-3 px-6 mb-6">
					{#each options as fruit (fruit.value)}
						<Select.Item
							value={fruit.value}
							label={fruit.label}
							side="right"
							class={cn(
								'p-3 rounded-xl bg-white shadow-xs border',
								value === fruit.value && 'ring-3 ring-primary/60 border-0'
							)}
							size="lg"
						>
							<div class="px-2 flex items-center gap-2">
								<fruit.icon class="mr-3 size-5" />
								<div class="grid">
									<span class="text-md">{fruit.label}</span>
									<span class="text-xs text-muted-foreground">{fruit.description}</span>
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
