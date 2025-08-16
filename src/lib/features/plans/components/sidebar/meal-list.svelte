<script lang="ts">
	import MealCard from '$lib/features/plans/components/MealCard.svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { flip } from 'svelte/animate';
	import { dndzone, dragHandle, dragHandleZone } from 'svelte-dnd-action';
	import { updateMealPosition } from '../../actions/update-meal';
	import { toast } from 'svelte-sonner';
	import type { MealWithIngredients } from '../../queries/get-plan-meals';
	import { GripVertical } from 'lucide-svelte';

	const activeSpace = getActiveSpaceState();

	const meals = $derived(
		(activeSpace.activePlan || [])
			.slice()
			.filter((meal) => !meal.deleted_at) // Filter out deleted meals
			.sort((a, b) => a.position - b.position)
	);

	const flipDurationMs = 220;

	function updateLocalMealPositions(items: MealWithIngredients[]) {
		if (!activeSpace.activePlan) return;
		activeSpace.activePlan = items.map((meal, index) => ({
			...meal,
			position: index
		}));
	}

	function handleDndConsider(e: { detail: { items: MealWithIngredients[] } }) {
		if (e.detail.items.length < 2) return;

		// Update the local state with the new order
		updateLocalMealPositions(e.detail.items);
	}

	async function handleDndFinalize(e: { detail: { items: MealWithIngredients[] } }) {
		if (e.detail.items.length < 2) return;

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
		toast.success('Meals reordered!', { id: toastId, duration: 3000 });
	}
</script>

<section
	use:dragHandleZone={{ items: meals, flipDurationMs }}
	onconsider={handleDndConsider}
	onfinalize={handleDndFinalize}
	class="grid space-y-2 m-4 rounded-sm"
>
	{#each meals as meal (meal.id)}
		<div animate:flip={{ duration: flipDurationMs }} class="flex gap-0.5">
			<!-- <div use:dragHandle class="mt-5">
				<GripVertical class="size-4 text-muted-foreground cursor-move" />
			</div> -->
			<MealCard {meal} />
		</div>
	{/each}
</section>
