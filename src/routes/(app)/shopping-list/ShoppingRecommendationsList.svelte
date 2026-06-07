<script lang="ts">
	import { addShoppingItem } from '$lib/features/plans/actions/add-shopping-item';
	import ShoppingItemBadge from '$lib/features/recipes/components/ShoppingItemBadge.svelte';
	import { type ShoppingRecommendation } from '$lib/features/spaces/queries/get-shopping-recommendations';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { cn } from '$lib/utils';
	import { flip } from 'svelte/animate';

	type Props = {
		recommendations: ShoppingRecommendation[];
		class?: string;
	};
	let { recommendations, class: className = '' }: Props = $props();
	const activeSpace = getActiveSpaceState();
</script>

<div class={cn('flex items-center gap-2 min-w-max', className)}>
	{#each recommendations as rec (rec.ingredient_id)}
		<div animate:flip={{ duration: 200 }}>
			<ShoppingItemBadge
				ingredientId={rec.ingredient_id}
				name={rec.name}
				score={`Bought ${rec.score} time${rec.score > 1 ? 's' : ''}`}
				class="w-full"
				onclick={async () => {
					await addShoppingItem(activeSpace, rec.ingredient_id, rec.name);
				}}
			></ShoppingItemBadge>
		</div>
	{:else}
		{#each Array.from({ length: 4 }) as _, index (`empty-${index}`)}
			<ShoppingItemBadge class={cn('w-24', className)} />
		{/each}
	{/each}
</div>
