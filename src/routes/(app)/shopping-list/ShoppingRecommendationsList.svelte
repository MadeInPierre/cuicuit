<script lang="ts">
	import { cn } from '$lib/utils';
	import { type ShoppingRecommendation } from '$lib/features/spaces/queries/get-shopping-recommendations';
	import { flip } from 'svelte/animate';
	import ShoppingItemBadge from '$lib/features/recipes/components/ShoppingItemBadge.svelte';
	import { addShoppingItem } from '$lib/features/plans/actions/add-shopping-item';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';

	type Props = {
		recommendations: ShoppingRecommendation[];
		loading: boolean;
		class?: string;
	};
	let { recommendations, loading, class: className = '' }: Props = $props();
	const activeSpace = getActiveSpaceState();
</script>

<div class={cn('flex items-center gap-2 min-w-max', className)}>
	{#each recommendations as rec (rec.ingredient_id)}
		<div animate:flip={{ duration: 300 }}>
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
		{#if loading}
			{#each Array.from( { length: Math.max(1, Math.floor(Math.random() * 4) + 1) } ) as _, index (`empty-${index}`)}
				<div animate:flip={{ duration: 300 }}>
					<ShoppingItemBadge class={cn('w-full', className)} />
				</div>
			{/each}
		{/if}
	{/each}
</div>
