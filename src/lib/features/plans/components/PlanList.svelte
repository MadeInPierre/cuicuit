<script lang="ts">
	import MealList from '$lib/features/plans/components/sidebar/MealList.svelte';
	import ShoppingItemCardGrid from '$lib/features/recipes/components/ShoppingItemCardGrid.svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import * as Tabs from '$lib/shared/components/ui/tabs/index.js';
	import { Calendar, ClipboardList, ShoppingBasket } from 'lucide-svelte';
	import { deletePlanItem } from '../actions/update-item';
	import { flip } from 'svelte/animate';

	const activeSpace = getActiveSpaceState();

	// Display recently added independent items
	const independentItems = $derived(
		activeSpace.activePlanItems &&
			activeSpace.activePlanItems
				.filter((item) => item.type === 'independent' && !item.checked_at)
				.slice(0, 12)
	);
</script>

<div class="flex w-full max-w-md flex-col gap-6">
	{#snippet sectionHeader(Icon: any, title: string, description: string)}
		<div class="flex items-center gap-4">
			<Icon class="size-5" />
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
				<MealList />
			</div>

			<div class="grid">
				{@render sectionHeader(ClipboardList, 'Anything else?', 'Add items to your grocery list')}

				{#if independentItems && independentItems.length > 0}
					<div class="pt-4 relative grid grid-cols-3 gap-2 max-h-[380px] pb-2 overflow-x-visible overflow-y-clip">
						{#if independentItems && independentItems.length > 9}
							<div
								class="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-6 bg-gradient-to-t from-sidebar to-transparent"
							></div>
						{/if}

						{#each independentItems as item (item.id)}
							<div animate:flip={{ duration: 300 }}>
								<ShoppingItemCardGrid
									ingredient={item.ingredient!}
									description={item.name}
									amount={item.quantity}
									unit={item.unit === 'whole' ? '' : item.unit || ''}
									size="sm"
									onclick={async () => {
										console.log('Clicked item:', item);
										// TODO add edit functionality (quantity, unit, name)
										await deletePlanItem(activeSpace, item.id);
									}}
								/>
							</div>
						{/each}
					</div>
				{:else}
					<div
						class="py-10 text-center text-xs text-muted-foreground bg-muted rounded-md flex flex-col items-center gap-2 border border-dashed"
					>
						<ShoppingBasket class="size-8" />
						<p class="mx-auto w-28 text-center">Search for items to add them here</p>
					</div>
				{/if}

				<!-- {#if activeSpace.activePlanItems && activeSpace.activePlanItems.length > 6}
					<Button variant="link" class="mx-auto text-muted-foreground/60 font-normal group">
						Show more
						<ArrowRight class="size-4 group-hover:translate-x-1 transition-transform" />
					</Button>
				{/if} -->
			</div>

			<!-- <div class="grid space-y-4">
				{@render sectionHeader(BellPlus, 'Refill suggestions', 'Ingredients that are running low')}
				<div
					class="py-10 text-center text-xs text-muted-foreground/60 bg-muted rounded-md flex flex-col items-center gap-2 border border-dashed"
				>
					<BellPlus class="size-8" />
					<p class="w-28 text-center">
						No low ingredients yet,
						<a class="underline decoration-dotted" href="?#">see rules</a>
					</p>
				</div>
			</div> -->
		</Tabs.Content>
		<Tabs.Content value="shopping">Here you can manage your grocery list.</Tabs.Content>
	</Tabs.Root>
</div>
