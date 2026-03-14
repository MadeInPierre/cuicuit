<script lang="ts">
	import MealListItem from '$lib/features/plans/components/MealListItem.svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { flip } from 'svelte/animate';
	import { dragHandle, dragHandleZone } from 'svelte-dnd-action';
	import { updateMealPosition } from '../../actions/update-meal';
	import { toast } from 'svelte-sonner';
	import type { MealWithRecipeAndIngredients } from '../../queries/get-plan-meals';
	import { GripVertical } from 'lucide-svelte';

	const activeSpace = getActiveSpaceState();

	const meals = $derived(activeSpace.activePlanMeals || []);

	const flipDurationMs = 220;

	function updateLocalMealPositions(items: MealWithRecipeAndIngredients[]) {
		if (!activeSpace.activePlanMeals) return;
		activeSpace.activePlanMeals = items.map((meal, index) => ({
			...meal,
			position: index
		}));
	}

	function handleDndConsider(e: { detail: { items: MealWithRecipeAndIngredients[] } }) {
		if (e.detail.items.length < 2) return;

		// Update the local state with the new order
		updateLocalMealPositions(e.detail.items);
	}

	async function handleDndFinalize(e: { detail: { items: MealWithRecipeAndIngredients[] } }) {
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
		await activeSpace.refreshActivePlanMeals();

		// Dismiss the loading toast
		toast.success('Meals reordered!', { id: toastId, duration: 3000 });
	}
</script>

<section
	use:dragHandleZone={{ items: meals, flipDurationMs }}
	onconsider={handleDndConsider}
	onfinalize={handleDndFinalize}
	class="grid space-y-2 rounded-sm"
>
	{#each meals as meal (meal.id)}
		<div animate:flip={{ duration: flipDurationMs }} class="flex gap-0.5 relative group">
			<div use:dragHandle class="mt-5">
				<GripVertical
					class="absolute -right-2 translate-x-1/2 size-4 text-muted-foreground cursor-move opacity-0 group-hover:opacity-100 transition-opacity"
				/>
			</div>
			<MealListItem {meal} showExpandedButtons />
		</div>
	{/each}
</section>
