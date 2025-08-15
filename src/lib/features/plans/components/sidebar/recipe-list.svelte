<script lang="ts">
	import MealCard from '$lib/features/plans/components/MealCard.svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { GripVertical } from 'lucide-svelte';

	const activeSpace = getActiveSpaceState();
</script>

<div class="grid space-y-2 m-2 ml-1">
	{#each activeSpace.activePlan || [] as meal}
	<div class="flex gap-0.5">
		<GripVertical class="size-4 mt-5 text-muted-foreground cursor-move" />
		<MealCard meal={meal} />
	</div>
	{/each}
</div>
