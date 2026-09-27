<script lang="ts">
	import { partitionByOptionality, type CombinedShoppingListItem } from './generate-shopping-list';
	import ShoppingItemsGrid from './ShoppingItemsGrid.svelte';

	type Props = {
		items: CombinedShoppingListItem[];
		layout: 'grid' | 'list';
		onCheckedChange: (item: CombinedShoppingListItem, checked: boolean) => void;
	};

	const { items, layout, onCheckedChange }: Props = $props();

	let partitioned = $derived(partitionByOptionality(items));
</script>

<ShoppingItemsGrid items={partitioned.required} {layout} {onCheckedChange} />

{#if partitioned.optionalOnly.length > 0}
	<div class="grid gap-2">
		{#if partitioned.required.length > 0}
			<p class="mt-2 text-sm text-muted-foreground italic">
				Optional{partitioned.optionalOnly.length > 1 ? 's' : ''}:
			</p>
		{/if}
		<ShoppingItemsGrid items={partitioned.optionalOnly} {layout} {onCheckedChange} />
	</div>
{/if}
