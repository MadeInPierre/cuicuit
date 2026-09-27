<script lang="ts">
	import { createPersistentState } from '$lib/shared/state/create-persistent-state.svelte';
	import { cn } from '$lib/utils';
	import { ChevronRight } from '@lucide/svelte';
	import { partitionByOptionality, type CombinedShoppingListItem } from './generate-shopping-list';
	import ShoppingItemsGrid from './ShoppingItemsGrid.svelte';

	type Props = {
		items: CombinedShoppingListItem[];
		layout: 'grid' | 'list';
		onCheckedChange: (item: CombinedShoppingListItem, checked: boolean) => void;
		/** Unique key for persisting this section's collapsed state (e.g. the aisle key) */
		collapseKey: string;
	};

	const { items, layout, onCheckedChange, collapseKey }: Props = $props();

	let partitioned = $derived(partitionByOptionality(items));

	// Per-section collapsed state, persisted independently (explicit string
	// conversion: localStorage only stores strings, so a raw boolean would
	// read the stored "false" back as truthy).
	// collapseKey is stable for the lifetime of a section instance (the
	// `{#each}` block is keyed by aisle), so capturing its initial value
	// as the storage key is intentional.
	// svelte-ignore state_referenced_locally
	let collapsed = createPersistentState<boolean>(
		`view-shopping-list-optionals-collapsed-${collapseKey}`,
		false,
		{
			toString: (value) => String(value),
			fromString: (value) => value === 'true'
		}
	);
</script>

<ShoppingItemsGrid items={partitioned.required} {layout} {onCheckedChange} />

{#if partitioned.optionalOnly.length > 0}
	<div class="grid gap-2">
		{#if partitioned.required.length > 0}
			<button
				onclick={() => (collapsed.value = !collapsed.value)}
				aria-expanded={!collapsed.value}
				class="flex w-fit items-center gap-1 text-sm text-muted-foreground"
			>
				{partitioned.optionalOnly.length} optional{partitioned.optionalOnly.length > 1 ? 's' : ''}
				<ChevronRight
					class={cn('size-4 transition-all duration-200', !collapsed.value && 'rotate-90')}
				/>
			</button>
		{/if}

		{#if !collapsed.value || partitioned.required.length === 0}
			<!-- <div transition:slide> -->
			<ShoppingItemsGrid items={partitioned.optionalOnly} {layout} {onCheckedChange} />
			<!-- </div> -->
		{/if}
	</div>
{/if}
