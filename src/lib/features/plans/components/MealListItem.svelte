<script lang="ts">
	import {
		Check,
		EqualApproximately,
		Plus,
		ShoppingBasket,
		Trash2,
		Users,
		Weight
	} from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_URL_CLOUD } from '$env/static/public';
	import { Button } from '$lib/shared/components/ui/button';
	import { deleteMeal, updateMealServings } from '../actions/update-meal';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import type { MealWithRecipeAndIngredients } from '../queries/get-plan-meals';
	import ServingsPlusMinus from '$lib/features/recipes/components/ServingsPlusMinus.svelte';
	import { dragHandle } from 'svelte-dnd-action';
	import NumberFlow from '@number-flow/svelte';
	import {
		hoveredMealIngredient,
		selectedMealIngredient
	} from '../state/hovered-meal-ingredient.svelte';
	import { fade, slide } from 'svelte/transition';
	import CookableStatus from '$lib/features/recipes/components/CookableStatus.svelte';
	import { openMealCardId } from '../state/open-meal-card.svelte';
	import IngredientImage from '$lib/features/recipes/components/IngredientImage.svelte';

	const space = getActiveSpaceState();

	interface Props {
		meal?: MealWithRecipeAndIngredients | null; // null for loading state
		showServings?: boolean; // Whether to show servings count in collapsed view
		showExpandedButtons?: boolean;
		class?: string;
	}

	let {
		meal = null,
		class: className = '',
		showServings = true,
		showExpandedButtons = false
	}: Props = $props();

	let activeId = $derived(
		selectedMealIngredient.value?.id || hoveredMealIngredient.value?.id || null
	);

	let hovered = $derived(
		hoveredMealIngredient.value &&
			meal?.shopping_ingredients.some(
				(ing) => ing.ingredient_id === hoveredMealIngredient.value?.id && ing.deleted_at === null
			)
	);

	let selected = $derived(
		selectedMealIngredient.value?.id !== null &&
			meal?.shopping_ingredients.some(
				(ing) => ing.ingredient_id === selectedMealIngredient.value?.id && ing.deleted_at === null
			)
	);

	let expanded = $derived(openMealCardId.value === meal?.id || selected);
</script>

{#if meal}
	<div class="grid w-full">
		<button
			class={cn(
				'flex z-10 w-full items-center p-2 space-x-2 bg-white dark:bg-muted rounded-md shadow-2xs relative group transition-all',

				hovered && !selected && 'ring-2 ring-primary/60 dark:ring-primary/60',

				className
			)}
			onclick={() => (openMealCardId.value = openMealCardId.value === meal.id ? null : meal.id)}
			aria-expanded={expanded}
		>
			{#if meal.recipe.image_ids && meal.recipe.image_ids.length > 0}
				<img
					use:dragHandle
					src={`${PUBLIC_SUPABASE_URL_CLOUD}/storage/v1/object/public/recipes/images/${meal.recipe.id}/${meal.recipe.image_ids[0]}`}
					alt="Recipe"
					class="aspect-square size-11 rounded-md object-cover"
					onerror={(e) => {
						if (meal.recipe.image_ids && meal.recipe.image_ids[0]) {
							(e.currentTarget as HTMLImageElement).src =
								`${PUBLIC_SUPABASE_URL}/storage/v1/object/public/recipes/images/${meal.recipe.id}/${meal.recipe.image_ids[0]}`;
						}
					}}
				/>
			{:else}
				<div class="aspect-square size-10 bg-gray-200 rounded-md"></div>
			{/if}

			<div class="grid">
				<h3
					class={cn(
						'text-xs text-start font-semibold leading-tight mb-0.5 line-clamp-1',
						meal.deleted_at && 'line-through text-muted-foreground'
					)}
				>
					{meal.recipe.title}
				</h3>

				<CookableStatus />
			</div>

			{#if hovered || selected}
				<div
					class="shrink-0 flex flex-col gap-0 items-center text-xs ml-auto"
					in:fade={{ duration: 200 }}
				>
					<IngredientImage id={activeId} class="size-7 rounded-full" />

					<span>
						{meal.shopping_ingredients.find((ing) => ing.ingredient_id === activeId)?.quantity ||
							''}
						{meal.shopping_ingredients.find((ing) => ing.ingredient_id === activeId)?.unit ===
						'whole'
							? ''
							: meal.shopping_ingredients.find((ing) => ing.ingredient_id === activeId)?.unit || ''}
					</span>
				</div>
			{:else if showServings && (!expanded || !showExpandedButtons)}
				<div
					class="flex gap-1 items-center text-xs font-semibold ml-auto shrink-0"
					in:fade={{ duration: 200 }}
				>
					<div class="flex items-center gap-1">
						<span>{meal.servings}</span>
						<Users class="size-3 inline-block" />
					</div>
				</div>
			{/if}
		</button>

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
							// Sort by checked state first, then by quantity (considering meal servings), then by name
							if (!a.checked_at && b.checked_at) return 1;
							if (a.checked_at && !b.checked_at) return -1;

							const aQuantity = a.quantity ?? 0;
							const bQuantity = b.quantity ?? 0;
							const aQty = (aQuantity * meal.servings) / meal.recipe.servings;
							const bQty = (bQuantity * meal.servings) / meal.recipe.servings;

							if (aQty === bQty) {
								return (a.name || a.ingredient?.translations[0]?.name_singular || '').localeCompare(b.name || b.ingredient?.translations[0]?.name_singular || '');
							}
							return bQty - aQty;
						}) as shopping_ingredient, i (shopping_ingredient.ingredient_id)}
						{@const t = shopping_ingredient.ingredient?.translations?.[0]}

						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class={cn(
								'grid text-xs text-muted-foreground rounded-sm duration-75 relative group transition-all',
								activeId === shopping_ingredient.ingredient_id &&
									'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary font-medium'
							)}
							onmouseenter={() => {
								hoveredMealIngredient.value = shopping_ingredient.ingredient;
							}}
							onmouseleave={() => {
								hoveredMealIngredient.value = null;
							}}
						>
							<!-- <div
								class="absolute opacity-0 group-hover:opacity-100 transition-opacity top-[3px] -translate-x-1/2 -right-6 z-10 rounded-sm border bg-muted"
							>
								<Ellipsis class="size-3.5" />
							</div> -->

							<div class="h-[22px] p-0.5 px-2 flex items-center">
								<span
									class={cn(
										'line-clamp-1',
										shopping_ingredient.meal_origin === 'ignored' &&
											'line-through text-muted-foreground/60',
										shopping_ingredient.checked_at && 'line-through text-primary'
									)}
								>
									{shopping_ingredient.quantity && shopping_ingredient.quantity > 1
										? t?.name_plural || t?.name_singular
										: t?.name_singular || t?.name_plural || shopping_ingredient.name}
								</span>

								{#if shopping_ingredient.meal_origin === 'recipe'}
									<!-- <Circle class="size-3 text-muted-foreground" /> -->
								{:else if shopping_ingredient.meal_origin === 'adjusted'}
									<Weight class="size-3 text-muted-foreground" />
								{:else if shopping_ingredient.meal_origin === 'ignored'}
									<!-- <X class="size-3 text-muted-foreground" /> -->
								{:else if shopping_ingredient.meal_origin === 'added'}
									<Plus class="size-3 text-muted-foreground" />
								{/if}

								<span
									class={cn(
										'ml-auto font-medium whitespace-nowrap select-none min-w-8 text-right text-green-600',
										shopping_ingredient.meal_origin === 'ignored' &&
											'line-through text-muted-foreground/60',
										shopping_ingredient.checked_at && 'text-primary line-through'
									)}
								>
									{#if showExpandedButtons}
										<NumberFlow
											value={((shopping_ingredient.quantity ?? 0) * meal.servings) /
												meal.recipe.servings}
										/>
									{:else}
										{((shopping_ingredient.quantity ?? 0) * meal.servings) / meal.recipe.servings}
									{/if}

									{shopping_ingredient.unit === 'whole' ? '' : shopping_ingredient.unit}
								</span>

								{#if shopping_ingredient.checked_at}
									<ShoppingBasket class="ml-1 max-w-3 max-h-3 text-primary" />
								{:else}
									<Check class="ml-1 max-w-3 max-h-3 text-green-600" />
								{/if}
							</div>

							<!-- {#if i === 0}
								<div class="flex gap-2 px-4 my-2">
									<Button variant="default" size="sm" class="h-6 w-full text-xs rounded-sm">
										<CircleSlash />
										Cook without
									</Button>

									<Button variant="default" size="sm" class="h-6 w-full text-xs rounded-sm">
										<ShoppingCart />
										Buy Later
									</Button>

									<Button variant="link" size="sm" class="h-6 w-min px-1.5 text-xs rounded-sm">
										<Ellipsis />
										Swap
									</Button>
								</div>
							{/if} -->
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
