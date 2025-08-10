<script lang="ts">
	import MealCard from '$lib/features/recipes/components/MealCard.svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';

	const activeSpace = getActiveSpaceState();
</script>

<div class="grid space-y-2 m-2">
	{#each activeSpace.activePlan || [] as meal}
		<MealCard meal={meal} />
	{/each}
</div>
