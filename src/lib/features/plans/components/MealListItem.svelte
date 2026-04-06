<script lang="ts">
	import IngredientImage from '$lib/features/recipes/components/IngredientImage.svelte';
	import RecipeListItem from '$lib/features/recipes/components/RecipeListItem.svelte';
	import ServingsPlusMinus from '$lib/features/recipes/components/ServingsPlusMinus.svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { cn } from '$lib/utils';
	import NumberFlow from '@number-flow/svelte';
	import {
		Check,
		CircleSlash,
		EllipsisVertical,
		ShoppingBasket,
		ShoppingCart,
		Trash2
	} from 'lucide-svelte';
	import { flip } from 'svelte/animate';
	import { fade, slide } from 'svelte/transition';
	import { deleteMeal, updateMealServings } from '../actions/update-meal';
	import type { MealWithRecipeAndIngredients } from '../queries/get-plan-meals';
	import {
		hoveredMealIngredient,
		selectedMealIngredient
	} from '../state/hovered-meal-ingredient.svelte';
	import { openMealCardId } from '../state/open-meal-card.svelte';

	const space = getActiveSpaceState();

	interface Props {
		meal?: MealWithRecipeAndIngredients | null; // null for loading state
		showServings?: boolean; // Whether to show servings count in collapsed view
		showExpandedButtons?: boolean;
		size?: 'md' | 'lg';
		class?: string;
	}

	let {
		meal = null,
		showServings = true,
		showExpandedButtons = false,
		size = 'md',
		class: className = ''
	}: Props = $props();

	let activeId = $derived(
		selectedMealIngredient.value?.id || hoveredMealIngredient.value?.id || null
	);

	let hovered = $derived(
		hoveredMealIngredient.value &&
			meal?.shopping_ingredients.some(
				(ing) => ing.ingredient_id === hoveredMealIngredient.value?.id
			)
	);

	let selected = $derived(
		selectedMealIngredient.value?.id !== null &&
			meal?.shopping_ingredients.some(
				(ing) => ing.ingredient_id === selectedMealIngredient.value?.id
			)
	);

	let expanded = $derived(openMealCardId.value === meal?.id || selected);
</script>

{#if meal}
	<div class="grid w-full">
		<RecipeListItem
			recipe={meal.recipe}
			showServings={(!expanded || !showExpandedButtons) && !(hovered || selected) && showServings}
			{size}
			class={cn(hovered && !selected && 'ring-2 ring-primary/60 dark:ring-primary/60', className)}
			onclick={() => (openMealCardId.value = openMealCardId.value === meal.id ? null : meal.id)}
			aria-expanded={expanded}
		>
			{#snippet endSnippet()}
				{#if hovered || selected}
					<!-- in:fade={{ duration: 75 }} -->
					<div class="shrink-0 flex flex-col gap-0 items-center text-xs ml-auto">
						<IngredientImage id={activeId} class="size-7 rounded-full" />

						<span>
							{(meal.shopping_ingredients.find((ing) => ing.ingredient_id === activeId)?.quantity ??
								0) *
								(meal.servings / meal.recipe.servings) || ''}

							{meal.shopping_ingredients.find((ing) => ing.ingredient_id === activeId)?.unit ===
							'whole'
								? ''
								: meal.shopping_ingredients.find((ing) => ing.ingredient_id === activeId)?.unit ||
									''}
						</span>
					</div>
				{:else}
					<Button variant="ghost" size="icon" class="ml-auto size-7 text-muted-foreground">
						<EllipsisVertical class="size-4" />
					</Button>
				{/if}
			{/snippet}
		</RecipeListItem>

		{#if expanded}
			<div
				transition:slide={{ duration: 300 }}
				class={cn(
					'grid space-y-2 bg-muted dark:bg-slate-950 rounded-b-md px-2 pt-6 -translate-y-4 relative',
					showExpandedButtons ? 'pb-3 mb-4' : 'pb-2'
				)}
			>
				<div class="grid">
					{#if meal.shopping_ingredients.length === 0}
						<p class="text-xs text-muted-foreground">No ingredients found.</p>
					{/if}

					{#each [...meal.shopping_ingredients]
						.filter((ing) => {
							// If hovering over a meal ingredient, only show that ingredient
							// if (selectedMealIngredientId.value) {
							// 	return ing.ingredient_id === selectedMealIngredientId.value && ing.deleted_at === null;
							// }

							// Otherwise, show all ingredients
							return true;
						})
						.sort((a, b) => {
							// Sort by ignored state first
							const aIgnored = a.deleted_at && !a.checked_at;
							const bIgnored = b.deleted_at && !b.checked_at;
							if (aIgnored && !bIgnored) return 1;
							if (!aIgnored && bIgnored) return -1;

							// Then by deleted state
							if (a.deleted_at && !b.deleted_at) return 1;
							if (!a.deleted_at && b.deleted_at) return -1;

							// Then by checked state
							if (!a.checked_at && b.checked_at) return -1;
							if (a.checked_at && !b.checked_at) return 1;

							// Then by quantity (adjusted for meal servings)
							const aQty = ((a.quantity ?? 0) * meal.servings) / meal.recipe.servings;
							const bQty = ((b.quantity ?? 0) * meal.servings) / meal.recipe.servings;

							// If quantities are equal, sort alphabetically
							const aName = a.ingredient?.translations[0]?.name_singular || a.name || '';
							const bName = b.ingredient?.translations[0]?.name_singular || b.name || '';
							if (aQty === bQty) return aName.localeCompare(bName);

							return bQty - aQty;
						}) as si (si.ingredient_id)}
						{@const t = si.ingredient?.translations?.[0]}

						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class={cn(
								'grid text-xs rounded-sm duration-75 relative transition-all group/si',
								activeId === si.ingredient_id &&
									'bg-primary/10 text-primary dark:bg-primary/20 font-medium'
							)}
							onmouseenter={() => {
								hoveredMealIngredient.value = si.ingredient;
							}}
							onmouseleave={() => {
								hoveredMealIngredient.value = null;
							}}
							animate:flip={{ duration: 200 }}
						>
							<!-- <div
								class="size-6 absolute top-1/2 -translate-y-1/2 -left-6 z-10 rounded-full border bg-white opacity-0 group-hover/si:opacity-100 transition-opacity"
							>
								<Pencil class="size-3.5 text-black m-auto" />
							</div> -->

							<div class="h-[22px] p-0.5 px-2 flex items-center">
								<span
									class={cn(
										'line-clamp-1 text-muted-foreground group-hover/si:text-primary ',
										si.deleted_at && !si.checked_at && 'line-through'
									)}
								>
									{si.quantity && si.quantity > 1
										? t?.name_plural || t?.name_singular
										: t?.name_singular || t?.name_plural || si.name}
								</span>

								<span
									class={cn(
										'ml-auto font-medium whitespace-nowrap select-none min-w-8 text-right text-red-600',
										si.checked_at && 'text-blue-600',
										si.deleted_at && 'text-green-600',
										si.deleted_at && !si.checked_at && 'text-muted-foreground'
									)}
								>
									<NumberFlow value={((si.quantity ?? 0) * meal.servings) / meal.recipe.servings} />

									{si.unit === 'whole' ? '' : si.unit}
								</span>

								{#if si.deleted_at && !si.checked_at}
									<CircleSlash class="ml-1 max-w-3 max-h-3 text-muted-foreground" />
								{:else if si.deleted_at}
									<Check class="ml-1 max-w-3 max-h-3 text-green-600" />
								{:else if si.checked_at}
									<ShoppingCart class="ml-1 max-w-3 max-h-3 text-blue-600" />
								{:else}
									<ShoppingBasket class="ml-1 max-w-3 max-h-3 text-red-600" />
								{/if}
							</div>
						</div>
					{/each}
				</div>

				{#if showExpandedButtons}
					<div
						class="absolute bottom-0 left-1/2 translate-y-1/2 -translate-x-1/2 flex items-center gap-2"
						in:fade={{ duration: 100, delay: 300 }}
						out:fade={{ duration: 100 }}
					>
						<div class="rounded-full p-1 bg-white border">
							<ServingsPlusMinus
								value={meal.servings}
								size="xs"
								variant="link"
								onIncrement={() => updateMealServings(space, meal.id, meal.servings + 1)}
								onDecrement={() => updateMealServings(space, meal.id, meal.servings - 1)}
								onDelete={() => deleteMeal(space, meal.id)}
							/>
						</div>

						<div class="rounded-full p-1 bg-white border flex">
							<Button
								variant="link"
								size="icon"
								class="size-5"
								onclick={() => deleteMeal(space, meal.id)}
							>
								<!-- <Ellipsis class="max-w-3.5 max-h-3.5" /> -->
								<!-- <Pencil class="max-w-3.5 max-h-3.5" /> -->
								<Trash2 class="max-w-3.5 max-h-3.5 text-destructive" />
							</Button>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{:else}
	<div class="w-full bg-muted rounded-md p-2">
		<!-- <div class="animate-pulse h-10 bg-gray-200 rounded-md"></div> -->
	</div>
{/if}
