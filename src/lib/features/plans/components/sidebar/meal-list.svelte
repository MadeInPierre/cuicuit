<script lang="ts">
	import MealCard from '$lib/features/plans/components/MealCard.svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { flip } from 'svelte/animate';
	import { dndzone } from 'svelte-dnd-action';
	import { updateMealPosition } from '../../actions/update-meal';
	import { toast } from 'svelte-sonner';
	import type { Tables } from '$lib/shared/db/supabase.types';

	const activeSpace = getActiveSpaceState();

	const meals = $derived(
		(activeSpace.activePlan || []).slice().sort((a, b) => a.position - b.position)
	);

	const flipDurationMs = 220;

	function updateLocalMealPositions(items: Tables<'space_plan_meals'>[]) {
		if (!activeSpace.activePlan) return;
		activeSpace.activePlan = items.map((meal, index) => ({
			...meal,
			position: index
		}));
	}

	function handleDndConsider(e: { detail: { items: Tables<'space_plan_meals'>[] } }) {
		if (e.detail.items.length === 0) return;

		// Update the local state with the new order
		updateLocalMealPositions(e.detail.items);
	}

	async function handleDndFinalize(e: { detail: { items: Tables<'space_plan_meals'>[] } }) {
		if (e.detail.items.length === 0) return;

		// Update the local state with the new order
		updateLocalMealPositions(e.detail.items);

		// Show loading toast
		const toastId = toast.loading('Updating meal positions...', { duration: Infinity });

		// Update the meal positions in the database
		for (const [index, meal] of e.detail.items.entries()) {
			await updateMealPosition(activeSpace, meal.id, index, { skipRefresh: true });
		}

		// Refresh the active plan meals after updating all positions
		await activeSpace.refreshActivePlan();

		// Dismiss the loading toast
		toast.success('Meal positions updated!', { id: toastId, duration: 3000 });
	}
</script>

<section
	use:dndzone={{ items: meals, flipDurationMs }}
	onconsider={handleDndConsider}
	onfinalize={handleDndFinalize}
	class="grid space-y-2 m-2 ml-1"
>
	{#each meals as meal (meal.id)}
		<div animate:flip={{ duration: flipDurationMs }} class="flex gap-0.5">
			<!-- <GripVertical class="size-4 mt-5 text-muted-foreground cursor-move" /> -->
			<MealCard {meal} />
		</div>
	{/each}
</section>
