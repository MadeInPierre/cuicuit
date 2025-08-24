<script lang="ts">
	import {
		Ellipsis,
		Pencil,
		Plus,
		Repeat,
		ShoppingCart,
		Trash2,
		Users,
		Weight,
		X
	} from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import { PUBLIC_SUPABASE_URL_CLOUD } from '$env/static/public';
	import { Button } from '$lib/shared/components/ui/button';
	import { deleteMeal, updateMealServings } from '../actions/update-meal';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import type { MealWithRecipeAndIngredients } from '../queries/get-plan-meals';
	import ServingsPlusMinus from '$lib/features/recipes/components/ServingsPlusMinus.svelte';
	import { dragHandle } from 'svelte-dnd-action';
	import NumberFlow from '@number-flow/svelte';
	import { hoveredMealIngredientId } from '../state/hovered-meal-ingredient.svelte';
	import { fade, slide } from 'svelte/transition';
	import CookableStatus from '$lib/features/recipes/components/CookableStatus.svelte';
	import { CircleSlash } from '@lucide/svelte';

	const activeSpace = getActiveSpaceState();

	interface Props {
		meal?: MealWithRecipeAndIngredients | null; // null for loading state
		expanded?: boolean; // Show expanded view with ingredients and controls
		showExpandedButtons?: boolean;
		class?: string;
	}

	let {
		meal = null,
		expanded: parentExpanded = false,
		class: className = '',
		showExpandedButtons = false
	}: Props = $props();

	let localExpanded = $state(false);
	let finalExpanded = $derived(parentExpanded || localExpanded);
</script>

{#if meal}
	<div class="grid w-full">
		<button
			use:dragHandle
			class={cn(
				'flex z-10 w-full items-center p-2 space-x-2 bg-white dark:bg-muted rounded-md border relative group',
				className
			)}
			ondblclick={() => (localExpanded = !localExpanded)}
		>
			<!-- <a href={'/recipes/' + recipe.id} class="shrink-0"> -->
			{#if meal.recipe.image_ids && meal.recipe.image_ids.length > 0}
				<img
					src={`${PUBLIC_SUPABASE_URL_CLOUD}/storage/v1/object/public/recipes/images/${meal.recipe.id}/${meal.recipe.image_ids[0]}`}
					alt="Recipe"
					class="aspect-square size-10 rounded-md object-cover border"
				/>
			{:else}
				<div class="aspect-square size-10 bg-gray-200 rounded-md"></div>
			{/if}
			<!-- </a> -->

			<div class="grid">
				<h3
					class={cn(
						'text-xs text-start text-primary font-semibold leading-tight mb-0.5 line-clamp-1',
						meal.deleted_at && 'line-through text-muted-foreground'
					)}
				>
					{meal.recipe.title}
				</h3>

				<CookableStatus />
			</div>

			{#if !finalExpanded || !showExpandedButtons}
				<div class="flex gap-1 items-center text-xs font-semibold ml-auto shrink-0 relative">
					<div class="flex items-center gap-1">
						<span>{meal.servings}</span>
						<Users class="size-3 inline-block" />
					</div>
				</div>
			{/if}
		</button>

		{#if finalExpanded}
			<div
				transition:slide={{ duration: 300 }}
				class={cn(
					'grid space-y-2 bg-muted dark:bg-slate-950 rounded-b-md px-2 pt-3 -translate-y-1 border relative',
					showExpandedButtons ? 'pb-3 mb-4' : 'pb-2'
				)}
			>
				<!-- <div class="flex gap-1 items-center">
					<h4 class="text-sm font-semibold tracking-tight">Planned for</h4>
					<ServingsPlusMinus
						value={meal.servings}
						size="xs"
						allowDelete
						onIncrement={() => updateMealServings(activeSpace, meal.id, meal.servings + 1)}
						onDecrement={() => updateMealServings(activeSpace, meal.id, meal.servings - 1)}
						onDelete={() => deleteMeal(activeSpace, meal.id)}
					/>
				</div> -->

				<div class="grid">
					{#if meal.shopping_ingredients.length === 0}
						<p class="text-xs text-muted-foreground">No ingredients found.</p>
					{/if}

					{#each [...meal.shopping_ingredients].sort((a, b) => {
						const order = { recipe: 0, adjusted: 0, added: 1, ignored: 2 };
						return order[a.meal_origin as keyof typeof order] - order[b.meal_origin as keyof typeof order];
					}) as shopping_ingredient, i (shopping_ingredient.ingredient_id)}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class={cn(
								'grid text-xs text-muted-foreground rounded-sm transition-colors relative group',
								hoveredMealIngredientId.value === shopping_ingredient.ingredient_id &&
									'bg-slate-200 dark:bg-slate-900'
							)}
							onmouseenter={() => {
								hoveredMealIngredientId.value = shopping_ingredient.ingredient_id;
							}}
							onmouseleave={() => {
								hoveredMealIngredientId.value = null;
							}}
						>
							<div
								class="absolute opacity-0 group-hover:opacity-100 transition-opacity top-[3px] -translate-x-1/2 -right-6 z-10 rounded-sm border bg-muted"
							>
								<Ellipsis class="size-3.5" />
							</div>

							<div class="h-[22px] p-0.5 px-2 flex items-center">
								<span
									class={cn(
										'line-clamp-2',
										shopping_ingredient.meal_origin === 'ignored' &&
											'line-through text-muted-foreground/60'
									)}
								>
									{shopping_ingredient.name ||
										shopping_ingredient.ingredient?.translations[0]?.name_singular}
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
										'ml-auto font-medium whitespace-nowrap cursor-ew-resize select-none min-w-8 text-right',
										shopping_ingredient.meal_origin === 'ignored' &&
											'line-through text-muted-foreground/60'
									)}
								>
									{#if showExpandedButtons}
										<NumberFlow
											value={(shopping_ingredient.quantity * meal.servings) / meal.recipe.servings}
										/>
									{:else}
										{(shopping_ingredient.quantity * meal.servings) / meal.recipe.servings}
									{/if}

									{shopping_ingredient.unit === 'whole' ? '' : shopping_ingredient.unit}
								</span>

								<!-- <Check class="max-w-3 max-h-3 text-green-600" /> -->
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

				<!-- <Button variant="default" size="sm" class="w-full text-xs flex items-center gap-1">
					<Pencil class="size-3.5" />
					Edit Ingredients
				</Button> -->

				{#if showExpandedButtons}
					<div
						class="absolute bottom-0 left-1/2 translate-y-1/2 -translate-x-1/2 flex items-center gap-2"
						in:fade={{ duration: 100, delay: 300 }}
						out:fade={{ duration: 100 }}
					>
						<div class="rounded-full p-1 bg-background border">
							<ServingsPlusMinus
								value={meal.servings}
								size="xs"
								variant="link"
								onIncrement={() => updateMealServings(activeSpace, meal.id, meal.servings + 1)}
								onDecrement={() => updateMealServings(activeSpace, meal.id, meal.servings - 1)}
								onDelete={() => deleteMeal(activeSpace, meal.id)}
							/>
						</div>

						<div class="rounded-full p-1 bg-background border flex">
							<Button
								variant="link"
								size="icon"
								class="size-5"
								onclick={() => deleteMeal(activeSpace, meal.id)}
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
