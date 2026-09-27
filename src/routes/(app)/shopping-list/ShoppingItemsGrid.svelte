<script lang="ts">
	import { updatePlanItemDeleted } from '$lib/features/plans/actions/update-item';
	import { hoveredMealIngredient } from '$lib/features/plans/state/hovered-meal-ingredient.svelte';
	import ShoppingItemCard from '$lib/features/recipes/components/ShoppingItemCard.svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { isPluralAmount } from '$lib/shared/utils/format-quantity';
	import { cn } from '$lib/utils';
	import { ChefHat, User, Users } from '@lucide/svelte';
	import { flip } from 'svelte/animate';
	import { computeColumns, FALLBACK_WIDTH } from '../recipes/carousel-layout.js';
	import {
		formatCombinedItemQuantity,
		type CombinedShoppingListItem
	} from './generate-shopping-list';

	type Props = {
		items: CombinedShoppingListItem[];
		layout: 'grid' | 'list';
		onCheckedChange: (item: CombinedShoppingListItem, checked: boolean) => void;
	};

	const { items, layout, onCheckedChange }: Props = $props();

	const space = getActiveSpaceState();

	// Card size constraints per layout (px). Mins for wrapping behavior; maxes cap how
	// wide a card can stretch so a lone item never fills a wide parent.
	const GRID_MIN = 86;
	const GRID_MAX = 160;
	const LIST_MIN = 288; // 18rem
	const LIST_MAX = 384; // 24rem

	// Measure the parent width — the single source of truth for the column
	// count, same approach as RecipeCarousel. Falls back before the
	// ResizeObserver fires (SSR / first paint).
	let rootEl = $state<HTMLDivElement>();
	let containerWidth = $state(0);

	$effect(() => {
		const el = rootEl;
		if (!el || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				containerWidth = entry.contentRect.width;
			}
		});
		observer.observe(el);
		containerWidth = el.getBoundingClientRect().width;
		return () => observer.disconnect();
	});

	const effectiveWidth = $derived(containerWidth > 0 ? containerWidth : FALLBACK_WIDTH);
	const columns = $derived(
		layout === 'grid'
			? computeColumns(effectiveWidth, {
					minCardWidth: GRID_MIN,
					maxCardWidth: GRID_MAX,
					gap: 8, // gap-2
					minColumns: 1
				})
			: computeColumns(effectiveWidth, {
					minCardWidth: LIST_MIN,
					maxCardWidth: LIST_MAX,
					gap: 12, // lg:gap-3
					minColumns: 1
				})
	);
</script>

<div class="w-full" bind:this={rootEl}>
	<div
		class={cn('grid gap-2', layout === 'list' && 'lg:gap-3')}
		style="grid-template-columns: repeat({columns}, minmax(0, 1fr));"
	>
		{#each items as item (item.ingredient?.id || item.name)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div
				class="flex group"
				animate:flip={{ duration: 200 }}
				onmouseenter={() => {
					if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) return;
					if (!item.ingredient) return; // No hover state for manual items
					hoveredMealIngredient.value = item.ingredient;
				}}
				onmouseleave={() => {
					if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) return;
					hoveredMealIngredient.value = null;
				}}
			>
				<ShoppingItemCard
					layout={layout || 'grid'}
					ingredient={item.ingredient}
					name={item.name}
					description={formatCombinedItemQuantity(item)}
					plural={Object.values(item.mergedQuantity).some((quantities) =>
						isPluralAmount(quantities.withOptionals)
					)}
					size="md"
					selectable
					onDelete={() => {
						// Soft delete all origins of the item
						item.items.forEach((si) => updatePlanItemDeleted(space, si.id));
					}}
					checked={item.items.some((si) => si.checked_at)}
					onCheckedChange={(newChecked) => onCheckedChange(item, newChecked)}
				>
					{#snippet topRight()}
						{#if layout === 'grid'}
							{#if item.meals.length > 0}
								<div class="flex gap-0.5">
									{#if item.meals.length > 1}
										<span>{item.meals.length}</span>
									{/if}
									<ChefHat class="size-3 mt-[1.2px]" />
								</div>
							{/if}

							{#if item.items.filter((i) => i.type === 'independent').length > 0}
								<div class="flex gap-0.5">
									{#if item.items.filter((i) => i.type === 'independent').length > 1}
										<span>
											{item.items.filter((i) => i.type === 'independent').length}
										</span>
										<Users class="size-3 mt-[1.5px]" />
									{:else}
										<User class="size-3 mt-[1.5px]" />
									{/if}
								</div>
							{/if}
						{/if}
					{/snippet}

					{#if layout === 'list'}
						<span class="text-xs text-muted-foreground/80 flex gap-3">
							{#if item.meals.length > 0}
								<div class="flex items-center gap-1">
									<ChefHat class="size-3 inline-block" />
									{item.meals
										.slice(0, 3)
										.map((m) => m.recipe.title.split(' ')?.[0] || '')
										.join(', ') + (item.meals.length > 3 ? ` +${item.meals.length - 3}` : '')}
								</div>
							{/if}

							{#if item.items.filter((i) => i.type === 'independent').length > 0}
								<div class="flex items-center gap-1">
									<User class="size-3 inline-block" />
									{item.items.filter((i) => i.type === 'independent').length}
								</div>
							{/if}
						</span>
					{/if}
				</ShoppingItemCard>
			</div>
		{/each}
	</div>
</div>
