<script lang="ts">
	import IngredientImage from '$lib/features/recipes/components/IngredientImage.svelte';
	import RecipeListItem from '$lib/features/recipes/components/RecipeListItem.svelte';
	import ServingsPlusMinus from '$lib/features/recipes/components/ServingsPlusMinus.svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { type Enums } from '$lib/shared/db/supabase.types';
	import { cn } from '$lib/utils';
	import NumberFlow from '@number-flow/svelte';
	import {
		Check,
		ChevronRight,
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

	let toggleOptional = $state(false);
	let showOptional = $derived(
		toggleOptional ||
			(selected &&
				meal?.shopping_ingredients.some(
					(ing) =>
						ing.ingredient_id === selectedMealIngredient.value?.id && ing.priority === 'optional'
				))
	);

	type ShoppingIngredient = MealWithRecipeAndIngredients['shopping_ingredients'][number];

	const priorityOrder = {
		required: 0,
		nicetohave: 1,
		whynot: 2,
		optional: 3
	} as Record<Enums<'item_priority'>, number>;

	function getDisplayName(si: ShoppingIngredient) {
		const t = si.ingredient?.translations?.[0];
		return si.quantity && si.quantity > 1
			? t?.name_plural || t?.name_singular || si.name
			: t?.name_singular || t?.name_plural || si.name;
	}

	function sortShoppingIngredients(
		a: ShoppingIngredient,
		b: ShoppingIngredient,
		servings: number,
		recipeServings: number
	) {
		// Sort by ignored status
		const aIgnored = a.deleted_at && !a.checked_at;
		const bIgnored = b.deleted_at && !b.checked_at;
		if (aIgnored && !bIgnored) return 1;
		if (!aIgnored && bIgnored) return -1;

		// Then sort by priority
		const aPriority = priorityOrder[a.priority] ?? 4;
		const bPriority = priorityOrder[b.priority] ?? 4;
		if (aPriority !== bPriority) return aPriority - bPriority;

		// Then sort by deleted then checked status
		if (a.deleted_at && !b.deleted_at) return 1;
		if (!a.deleted_at && b.deleted_at) return -1;

		if (!a.checked_at && b.checked_at) return -1;
		if (a.checked_at && !b.checked_at) return 1;

		// Finally, sort by quantity (scaled to meal servings), then name
		const aName = a.ingredient?.translations?.[0]?.name_singular || a.name || '';
		const bName = b.ingredient?.translations?.[0]?.name_singular || b.name || '';
		if (a.quantity && b.quantity && a.quantity === b.quantity) return aName.localeCompare(bName);
		return (b.quantity || 0) - (a.quantity || 0);
	}

	let sortedIngredients = $derived(
		meal
			? [...meal.shopping_ingredients].sort((a, b) =>
					sortShoppingIngredients(a, b, meal.servings, meal.recipe.servings)
				)
			: []
	);

	let requiredIngredients = $derived(
		sortedIngredients.filter((ing) => ing.priority !== 'optional')
	);

	let optionalIngredients = $derived(
		sortedIngredients.filter((ing) => ing.priority === 'optional')
	);
</script>

{#if meal}
	<div class="grid w-full">
		<RecipeListItem
			recipe={meal.recipe}
			servings={(!expanded || !showExpandedButtons) && !(hovered || selected) && showServings && meal.servings}
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
								0) ||
								''}

							{meal.shopping_ingredients.find((ing) => ing.ingredient_id === activeId)?.unit ===
							'whole'
								? ''
								: meal.shopping_ingredients.find((ing) => ing.ingredient_id === activeId)?.unit ||
									''}
						</span>
					</div>
				{:else}
					<Button
						variant="ghost"
						size="icon"
						class="ml-auto size-7 text-muted-foreground"
						onclick={(e) => {
							e.stopPropagation();
							// TODO menu to edit/switch ingredients, etc.
						}}
					>
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

					{#each requiredIngredients as si (si.ingredient_id)}
						<div animate:flip={{ duration: 200 }}>
							{@render ingredientRow(si)}
						</div>
					{/each}

					<!-- Toggle show optional ingredients -->
					<button
						class={cn(
							'text-xs rounded-sm duration-75 transition-all hover:bg-accent hover:text-primary hover:font-medium',
							showOptional && 'font-medium'
						)}
						onclick={() => (toggleOptional = !toggleOptional)}
					>
						<div class="h-[22px] p-0.5 px-2 flex items-center gap-1">
							<span class={cn('text-muted-foreground')}>
								+{optionalIngredients.length}
								optional{optionalIngredients.length > 1 ? 's' : ''}
							</span>

							<ChevronRight
								class={cn(
									'max-w-3 max-h-3 text-muted-foreground transition-transform duration-75',
									showOptional && 'rotate-90'
								)}
							/>
						</div>
					</button>

					{#if showOptional}
						<div transition:slide={{ duration: 200 }}>
							{#each optionalIngredients as si (si.ingredient_id)}
								<div animate:flip={{ duration: 200 }}>
									{@render ingredientRow(si, 'optional')}
								</div>
							{/each}
						</div>
					{/if}
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
								step={meal.recipe.servings}
								onIncrement={() =>
									updateMealServings(space, meal, meal.servings + meal.recipe.servings)}
								onDecrement={() =>
									updateMealServings(
										space,
										meal,
										Math.max(0, meal.servings - meal.recipe.servings)
									)}
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

{#snippet ingredientRow(si: ShoppingIngredient, variant: 'default' | 'optional' = 'default')}
	{@const displayName = getDisplayName(si)}

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class={cn(
			'grid text-xs rounded-sm duration-75 relative transition-all group/si',
			activeId === si.ingredient_id && 'bg-primary/10 text-primary dark:bg-primary/20 font-medium'
		)}
		onmouseenter={() => {
			hoveredMealIngredient.value = si.ingredient;
		}}
		onmouseleave={() => {
			hoveredMealIngredient.value = null;
		}}
	>
		<div class="h-[22px] p-0.5 px-2 flex items-center">
			<span
				class={cn(
					'text-muted-foreground group-hover/si:text-primary',
					variant === 'optional' && 'italic',
					si.deleted_at && !si.checked_at && 'line-through'
				)}
			>
				{displayName}
			</span>

			<span
				class={cn(
					'ml-auto font-medium whitespace-nowrap select-none min-w-8 text-right text-red-600',
					si.checked_at && 'text-blue-600',
					si.deleted_at && 'text-green-600',
					si.deleted_at && !si.checked_at && 'text-muted-foreground'
				)}
			>
				<NumberFlow value={si.quantity || 0} />
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
{/snippet}
