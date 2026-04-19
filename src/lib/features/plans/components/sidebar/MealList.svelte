<script lang="ts">
	import MealCard from '$lib/features/plans/components/MealCard.svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { GripVertical } from 'lucide-svelte';
	import { dragHandle, dragHandleZone } from 'svelte-dnd-action';
	import { toast } from 'svelte-sonner';
	import { flip } from 'svelte/animate';
	import { slide } from 'svelte/transition';
	import { updateMealPosition } from '../../actions/update-meal';
	import type { MealWithRecipeAndIngredients } from '../../queries/get-plan-meals';

	const activeSpace = getActiveSpaceState();

	type Props = {
		meals: MealWithRecipeAndIngredients[];
		cardSize?: 'md' | 'lg';
		expandOnSelected?: boolean; // Whether to automatically expand meal cards when an ingredient is selected
	};

	let { meals, cardSize = 'md', expandOnSelected = false }: Props = $props();

	const flipDurationMs = 300;

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
	use:dragHandleZone={{
		items: meals,
		flipDurationMs: flipDurationMs,
		delayTouchStart: 300,
		dropTargetStyle: { outline: '0px' }
	}}
	onconsider={handleDndConsider}
	onfinalize={handleDndFinalize}
	class="grid space-y-2 rounded-sm"
>
	{#each meals as meal (meal.id)}
		<div
			animate:flip={{ duration: flipDurationMs }}
			transition:slide={{ duration: 200 }}
			class="flex gap-0.5 relative group"
		>
			<div use:dragHandle class="mt-5">
				<GripVertical
					class="absolute -left-2 -translate-x-1.5 size-4 text-muted-foreground cursor-drag opacity-0 group-hover:opacity-100 transition-opacity"
				/>
			</div>

			<MealCard {meal} showExpandedButtons size={cardSize} {expandOnSelected} />
		</div>
	{/each}
</section>
