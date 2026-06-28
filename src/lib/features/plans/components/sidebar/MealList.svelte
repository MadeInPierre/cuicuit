<script lang="ts">
	import MealCard from '$lib/features/plans/components/MealCard.svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import {
		swipeable,
		type SwipeEndEventDetail,
		type SwipeSingleDirection,
		type SwipeStartEventDetail
	} from '@svelte-put/swipeable';
	import { Check, GripVertical, Trash2 } from 'lucide-svelte';
	import { dragHandle, dragHandleZone } from 'svelte-dnd-action';
	import { toast } from 'svelte-sonner';
	import { flip } from 'svelte/animate';
	import { slide } from 'svelte/transition';
	import { deleteMeal, updateMealPosition } from '../../actions/update-meal';
	import type { MealWithRecipeAndIngredients } from '../../queries/get-plan-meals';

	const space = getActiveSpaceState();

	type Props = {
		meals: MealWithRecipeAndIngredients[];
		cardSize?: 'md' | 'lg';
		expandOnSelected?: boolean; // Whether to automatically expand meal cards when an ingredient is selected
	};

	let { meals, cardSize = 'md', expandOnSelected = false }: Props = $props();

	let slideDurationMs = $state(200);

	function updateLocalMealPositions(items: MealWithRecipeAndIngredients[]) {
		if (!space.activePlanMeals) return;
		space.activePlanMeals = items.map((meal, index) => ({
			...meal,
			position: index
		}));
	}

	function handleDndConsider(e: { detail: { items: MealWithRecipeAndIngredients[] } }) {
		if (e.detail.items.length < 2) return;

		// Update the local state with the new order
		slideDurationMs = 0;
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
			await updateMealPosition(space, meal.id, index, { skipRefresh: true });
		}

		// Refresh the active plan meals after updating all positions
		await space.refreshActivePlanMeals();

		// Dismiss the loading toast
		toast.success('Meals reordered!', { id: toastId, duration: 3000 });
		slideDurationMs = 200;
	}

	let direction: SwipeSingleDirection | null = $state(null);
	function swipestart(e: CustomEvent<SwipeStartEventDetail>) {
		direction = e.detail.direction;
	}

	async function swipeend(e: CustomEvent<SwipeEndEventDetail>, mealId: string) {
		const { passThreshold, direction } = e.detail;
		if (passThreshold) {
			if (direction === 'left') await deleteMeal(space, mealId);
			else {
				// TODO implement marked as cooked
				await deleteMeal(space, mealId);
				toast.success('Marked as cooked', { description: 'Bon appétit ! TODO NOT IMPLEMENTED' });
			}
		}
	}
</script>

<div
	class="grid space-y-2 rounded-sm"
	use:dragHandleZone={{
		items: meals,
		flipDurationMs: 200,
		delayTouchStart: 300,
		dropTargetStyle: { outline: '0px' }
	}}
	onconsider={handleDndConsider}
	onfinalize={handleDndFinalize}
>
	{#each meals as meal (meal.id)}
		<div animate:flip={{ duration: 200 }}>
			<div
				use:swipeable={{
					direction: 'x',
					disableTouchEvents: false,
					followThrough: { container: 'body' }
				}}
				style:left="var(--swipe-distance-x)"
				style="touch-action: pan-y;"
				onswipestart={swipestart}
				onswipeend={(e) => swipeend(e, meal.id)}
				class="flex relative group"
				transition:slide={{ duration: slideDurationMs }}
			>
				<div class="mt-5" use:dragHandle>
					<GripVertical
						class="absolute -left-2.5 -translate-x-1.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground cursor-drag opacity-0 group-hover:opacity-100 transition-opacity"
					/>
				</div>

				{#if direction === 'left'}
					<div
						class="absolute text-red-600 bg-red-600/10 w-full rounded-lg z-0 flex items-center gap-2 justify-end pr-6 text-sm"
						class:h-19={cardSize === 'lg'}
						class:h-15={cardSize === 'md'}
						style:right="var(--swipe-distance-x)"
					>
						Delete
						<Trash2 class="size-4" />
					</div>
				{:else if direction === 'right'}
					<div
						class="absolute text-emerald-600 bg-emerald-600/10 w-full h-19 rounded-lg z-0 flex items-center gap-2 pl-6 text-sm"
						class:h-19={cardSize === 'lg'}
						class:h-15={cardSize === 'md'}

						style:right="var(--swipe-distance-x)"
					>
						<Check class="size-4" />
						Cooked
					</div>
				{/if}

				<MealCard {meal} showExpandedButtons size={cardSize} {expandOnSelected} />
			</div>
		</div>
	{/each}
</div>
