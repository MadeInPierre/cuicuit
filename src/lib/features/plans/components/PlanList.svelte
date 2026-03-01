<script lang="ts">
	import MealList from '$lib/features/plans/components/sidebar/meal-list.svelte';
	import * as Tabs from '$lib/shared/components/ui/tabs/index.js';
	import { Calendar, ShoppingBasket } from 'lucide-svelte';

	type Props = {
		expanded?: boolean;
	};
	const { expanded = false }: Props = $props();
</script>

<div class="flex w-full max-w-md flex-col gap-6">
	{#snippet sectionHeader(Icon: any, title: string, description: string)}
		<div class="flex items-center gap-4">
			<Icon class="size-4" />
			<div class="grid gap-0.5">
				<h3 class="text-sm font-semibold">{title}</h3>
				<p class="text-xs text-muted-foreground">{description}</p>
			</div>
		</div>
	{/snippet}

	<Tabs.Root value="plan" class="">
		<!-- <Tabs.List class="w-full">
			<Tabs.Trigger class="w-full" value="plan">Plan</Tabs.Trigger>
			<Tabs.Trigger class="w-full" value="shopping">Groceries</Tabs.Trigger>
		</Tabs.List> -->
		<Tabs.Content value="plan" class="grid space-y-8">
			<div class="grid w-full space-y-4">
				{@render sectionHeader(Calendar, 'Planned meals', 'Reserve pantry ingredients')}
				<MealList {expanded} />
			</div>

			<!-- <div class="grid space-y-4">
				{@render sectionHeader(Clock, 'Set aside', "Ideas that don't use the pantry")}
				<div
					class="py-10 text-center text-xs text-muted-foreground/60 bg-muted rounded-md flex flex-col items-center gap-2 border border-dashed"
				>
					<Clock class="size-8" />
					<p class="w-28 text-center">Drag recipes here to set aside for later.</p>
				</div>
			</div> -->

			<div class="grid space-y-4">
				{@render sectionHeader(ShoppingBasket, 'Anything else?', 'Add items to your grocery list')}
				<div
					class="py-10 text-center text-xs text-muted-foreground bg-muted rounded-md flex flex-col items-center gap-2 border border-dashed"
				>
					<ShoppingBasket class="size-8" />
					<p class="mx-auto w-28 text-center">Search for items to add them here</p>
				</div>
			</div>
		</Tabs.Content>
		<Tabs.Content value="shopping">Here you can manage your grocery list.</Tabs.Content>
	</Tabs.Root>
</div>
