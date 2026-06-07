<script lang="ts">
	import IngredientImage from '$lib/features/recipes/components/IngredientImage.svelte';
	import RecipeCard from '$lib/features/recipes/components/RecipeCard.svelte';
	import ServingsPlusMinus from '$lib/features/recipes/components/ServingsPlusMinus.svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { type Enums } from '$lib/shared/db/supabase.types';
	import { cn } from '$lib/utils';
	import NumberFlow from '@number-flow/svelte';
	import {
		ChevronRight,
		CircleSlash,
		Home,
		Play,
		ShoppingBasket,
		ShoppingCart,
		Trash
	} from 'lucide-svelte';
	import type { Snippet } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { flip } from 'svelte/animate';
	import { fade, slide } from 'svelte/transition';
	import { updatePlanItemChecked, updatePlanItemDeleted } from '../actions/update-item';
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
		expandable?: boolean; // Whether the meal card can be expanded to show ingredients
		expandOnSelected?: boolean; // Whether to automatically expand the card when an ingredient is selected
		showExpandedButtons?: boolean;
		size?: 'md' | 'lg';
		class?: string;
		cardEndSnippet?: Snippet | null; // Additional content to show at the end of the meal card (e.g. for shopping list)
	}

	let {
		meal = null,
		expandable = true,
		expandOnSelected = false,
		showExpandedButtons = false,
		size = 'md',
		class: className = '',
		cardEndSnippet = null
	}: Props = $props();

	let activeId = $derived(
		selectedMealIngredient.value?.id || hoveredMealIngredient.value?.id || null
	);

	let hovered = $derived(
		(hoveredMealIngredient.value &&
			meal?.shopping_ingredients.some(
				(ing) => ing.ingredient_id === hoveredMealIngredient.value?.id && !ing.deleted_at
			)) ||
			false
	);

	let selected = $derived(
		(selectedMealIngredient.value?.id !== null &&
			meal?.shopping_ingredients.some(
				(ing) => ing.ingredient_id === selectedMealIngredient.value?.id && !ing.deleted_at
			)) ||
			false
	);

	let expanded = $derived(
		expandable && (openMealCardId.value === meal?.id || (expandOnSelected && selected))
	);

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
	{#snippet defaultEndSnippet()}
		{#if hovered || selected}
			<!-- in:fade={{ duration: 75 }} -->
			<div class="shrink-0 flex flex-col gap-0 items-center text-xs">
				<IngredientImage id={activeId} class="size-7 rounded-full" />

				<span>
					{(meal.shopping_ingredients.find((ing) => ing.ingredient_id === activeId)?.quantity ??
						0) ||
						''}

					{meal.shopping_ingredients.find((ing) => ing.ingredient_id === activeId)?.unit === 'whole'
						? ''
						: meal.shopping_ingredients.find((ing) => ing.ingredient_id === activeId)?.unit || ''}
				</span>
			</div>
		{:else if expanded}
			<Button
				variant="ghost"
				size="icon"
				class="size-7 text-muted-foreground"
				onclick={(e) => {
					e.stopPropagation();
					// TODO menu to edit/switch ingredients, etc.
					deleteMeal(space, meal.id);
				}}
			>
				<Trash class="size-4" />
			</Button>
		{/if}
	{/snippet}

	<div class="grid w-full">
		<RecipeCard
			recipe={meal.recipe}
			servings={meal.servings}
			{size}
			class={cn(
				'transition-[color,box-shadow]',
				hovered && !selected && 'border-ring ring-ring/50 ring-[3px]',
				className
			)}
			onclick={() => {
				if (!expandable) return;
				openMealCardId.value = openMealCardId.value === meal.id ? null : meal.id;
			}}
			endSnippet={cardEndSnippet || (selected || hovered || expanded ? defaultEndSnippet : null)}
		/>

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

					{#if optionalIngredients.length > 0}
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

						<div class="rounded-full p-1 bg-white flex border">
							<Button
								variant="link"
								size="icon"
								class="size-5"
								onclick={() => toast('Starting meal...')}
							>
								<Play class="max-w-3.5 max-h-3.5 text-foreground" />
							</Button>
						</div>

						<!-- <div class="rounded-full p-1 bg-white border flex">
							<Button
								variant="link"
								size="icon"
								class="size-5"
								onclick={() => deleteMeal(space, meal.id)}
							>
								<Ellipsis class="max-w-3.5 max-h-3.5 text-destructive" />
							</Button>
						</div> -->
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

{#snippet ingredientRow(si: ShoppingIngredient, variant: 'default' | 'optional' = 'default')}
	{@const displayName = getDisplayName(si)}
	{@const status =
		si.deleted_at && !si.checked_at
			? 'ignore'
			: si.deleted_at
				? 'home'
				: si.checked_at
					? 'cart'
					: 'missing'}

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
		<div class="h-[22px] p-0.5 pl-2 flex items-center">
			<span
				class={cn(
					'mr-auto text-muted-foreground group-hover/si:text-primary',
					variant === 'optional' && 'italic',
					si.deleted_at && !si.checked_at && 'line-through'
				)}
			>
				{displayName}
			</span>

			<div class="min-w-22 h-[22px] group/qty flex items-center justify-end">
				<div class="flex pr-2 group-hover/qty:hidden items-center">
					<span
						class={cn(
							'font-medium whitespace-nowrap select-none min-w-8 text-right text-red-600',
							si.checked_at && 'text-blue-600',
							si.deleted_at && 'text-green-600',
							si.deleted_at && !si.checked_at && 'text-muted-foreground'
						)}
					>
						<NumberFlow value={si.quantity || 0} />
						{si.unit === 'whole' ? '' : si.unit}
					</span>

					{#if status === 'ignore'}
						<CircleSlash class="ml-1 max-w-3 max-h-3 text-muted-foreground" />
					{:else if status === 'home'}
						<Home class="ml-1 max-w-3 max-h-3 text-green-600" />
					{:else if status === 'cart'}
						<ShoppingCart class="ml-1 max-w-3 max-h-3 text-blue-600" />
					{:else if status === 'missing'}
						<ShoppingBasket class="ml-1 max-w-3 max-h-3 text-red-600" />
					{/if}
				</div>

				<div class="hidden pr-1 group-hover/qty:flex items-center">
					{@render statusButton(
						si,
						'missing',
						status === 'missing',
						ShoppingBasket,
						'bg-red-600 text-white'
					)}
					{@render statusButton(
						si,
						'cart',
						status === 'cart',
						ShoppingCart,
						'bg-blue-600 text-white'
					)}
					{@render statusButton(si, 'home', status === 'home', Home, 'bg-green-600 text-white')}
					{@render statusButton(
						si,
						'ignore',
						status === 'ignore',
						CircleSlash,
						'bg-muted-foreground text-white'
					)}
				</div>
			</div>
		</div>
	</div>
{/snippet}

{#snippet statusButton(
	si: ShoppingIngredient,
	status: 'missing' | 'cart' | 'home' | 'ignore',
	isActive: boolean,
	Icon: any,
	activeClass: string
)}
	<Button
		variant="link"
		size="icon"
		class={cn('w-5 h-5 text-muted-foreground', isActive && activeClass)}
		onclick={async (e) => {
			e.stopPropagation();

			let checked = status === 'cart' || status === 'home';
			let deleted = status === 'home' || status === 'ignore';
			const undoChecked = await updatePlanItemChecked(space, si.id, checked, {
				skipRefresh: true
			});
			const undoDeleted = await updatePlanItemDeleted(space, si.id, deleted, {
				skipRefresh: true
			});

			const toastId = toast.success(`Set ${getDisplayName(si)} to ${status}`, {
				duration: 5000,
				description: meal?.recipe.title || '',
				action: {
					label: 'Undo',
					onClick: async () => {
						toast.loading('Reverting changes...', { id: toastId });
						await undoChecked();
						await undoDeleted();
						await space.refreshActivePlanMeals({ refreshShoppingList: false });
						await space.refreshActivePlanItems();
						toast.success('Changes reverted', { id: toastId });
					}
				}
			});

			await space.refreshActivePlanMeals({ refreshShoppingList: false });
			await space.refreshActivePlanItems();
		}}
	>
		<Icon class="size-3" />
	</Button>
{/snippet}
