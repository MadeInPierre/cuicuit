<script lang="ts">
	import { CheckCheck, Plus, Trash2, Users, Weight } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import { PUBLIC_SUPABASE_URL_CLOUD } from '$env/static/public';
	import { Button } from '$lib/shared/components/ui/button';
	import {
		getRecipeDetailed,
		type RecipeDetailedWithAuthor
	} from '$lib/features/recipes/queries/get-recipe-detailed';
	import { onMount } from 'svelte';
	import { deleteMeal, updateMealServings } from '../actions/update-meal';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import type { MealWithIngredients } from '../queries/get-plan-meals';
	import ServingsPlusMinus from '$lib/features/recipes/components/ServingsPlusMinus.svelte';
	import { dragHandle } from 'svelte-dnd-action';
	import NumberFlow from '@number-flow/svelte';

	const activeSpace = getActiveSpaceState();

	interface Props {
		meal?: MealWithIngredients | null; // Allow recipe to be null for loading state
		expanded?: boolean; // Show expanded view with ingredients and controls
		class?: string;
	}

	let { meal = null, expanded = false, class: className = '' }: Props = $props();

	let recipe: RecipeDetailedWithAuthor | undefined = $state(undefined);

	// Fetch the recipe details when the component mounts
	onMount(() => {
		if (meal && meal.recipe_id) {
			// Fetch the recipe details if meal is provided
			getRecipeDetailed(meal.recipe_id)
				.then((data) => {
					if (data.error) {
						console.error('Error fetching recipe details:', data.error);
						return;
					}

					recipe = data.data;
				})
				.catch((error) => {
					console.error('Error fetching recipe details:', error);
				});
		}
	});
</script>

{#if meal && recipe}
	<div class="grid w-full">
		<button
			use:dragHandle
			class={cn(
				'flex z-10 w-full items-center p-2 space-x-2 bg-white dark:bg-muted rounded-md border relative group',
				className
			)}
		>
			<!-- <a href={'/recipes/' + recipe.id} class="flex-shrink-0"> -->
			{#if recipe.image_ids && recipe.image_ids.length > 0}
				<img
					src={`${PUBLIC_SUPABASE_URL_CLOUD}/storage/v1/object/public/recipes/images/${recipe.id}/${recipe.image_ids[0]}`}
					alt="Recipe"
					class="aspect-square size-10 rounded-md object-cover border"
				/>
			{:else}
				<div class="aspect-square size-10 bg-gray-200 rounded-md"></div>
			{/if}
			<!-- </a> -->

			<div class="grid flex-1 min-w-0">
				<h3
					class={cn(
						'text-xs text-start text-primary font-semibold leading-tight mb-0.5 line-clamp-1',
						meal.deleted_at && 'line-through text-muted-foreground'
					)}
				>
					{recipe.title}
				</h3>

				<div class="flex items-center gap-1">
					{#snippet status(status: string, Icon: any, color: string)}
						<div class="text-xs flex items-center {color}">
							<Icon class="size-3.5 inline-block mr-1" />
							<span>{status}</span>
						</div>
					{/snippet}

					{@render status('Ready to cook', CheckCheck, 'text-green-600 dark:text-green-500')}
				</div>
			</div>

			{#if !expanded}
				<div class="flex gap-1 items-center text-xs font-semibold ml-auto flex-shrink-0 relative">
					<div class="flex items-center gap-1">
						<span>{meal.servings}</span>
						<Users class="size-3 inline-block" />
					</div>
				</div>
			{/if}
		</button>

		{#if expanded}
			<div
				class="w-full grid space-y-2 bg-muted rounded-b-md px-2 pt-3 pb-5 mb-4 -translate-y-1 border relative"
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
					{#if meal.ingredients.length === 0}
						<p class="text-xs text-muted-foreground">No ingredients found.</p>
					{/if}

					{#each [...meal.ingredients].sort((a, b) => {
						const order = { recipe: 0, adjusted: 0, added: 1, ignored: 2 };
						return order[a.meal_origin as keyof typeof order] - order[b.meal_origin as keyof typeof order];
					}) as ingredient (ingredient.ingredient_id)}
						<div
							class="flex items-center gap-2 text-xs text-muted-foreground hover:bg-slate-200 p-0.5 px-2 rounded-sm transition-colors"
						>
							<span
								class={cn(
									'line-clamp-2',
									ingredient.meal_origin === 'ignored' && 'line-through text-muted-foreground/60'
								)}
							>
								{ingredient.name || ingredient.ingredient?.translations[0]?.name_singular}
							</span>

							{#if ingredient.meal_origin === 'recipe'}
								<!-- <Circle class="size-3 text-muted-foreground" /> -->
							{:else if ingredient.meal_origin === 'adjusted'}
								<Weight class="size-3 text-muted-foreground" />
							{:else if ingredient.meal_origin === 'ignored'}
								<!-- <X class="size-3 text-muted-foreground" /> -->
							{:else if ingredient.meal_origin === 'added'}
								<Plus class="size-3 text-muted-foreground" />
							{/if}

							<span
								class={cn(
									'ml-auto font-medium whitespace-nowrap min-w-0',
									ingredient.meal_origin === 'ignored' && 'line-through text-muted-foreground/60'
								)}
							>
								<NumberFlow value={(ingredient.quantity * meal.servings) / recipe.servings} />
								{ingredient.unit === 'whole' ? '' : ingredient.unit}
							</span>

							<!-- <Check class="max-w-3 max-h-3 text-green-600" /> -->
						</div>
					{/each}
				</div>

				<!-- <Button variant="default" size="sm" class="w-full text-xs flex items-center gap-1">
					<Pencil class="size-3.5" />
					Edit Ingredients
				</Button> -->

				<div
					class="absolute bottom-0 left-1/2 translate-y-1/2 -translate-x-1/2 flex items-center gap-2"
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

					<!-- <div class="rounded-full p-1 bg-background border flex">
					<Button variant="link" size="icon" class="size-5">
						<Pencil class="max-w-3.5 max-h-3.5" />
					</Button>
				</div> -->

					<div class="rounded-full p-1 bg-background border flex">
						<Button
							variant="link"
							size="icon"
							class="size-5"
							onclick={() => deleteMeal(activeSpace, meal.id)}
						>
							<Trash2 class="max-w-3.5 max-h-3.5 text-destructive" />
						</Button>
					</div>

					<!-- <div class="rounded-full p-1 flex bg-yellow-500">
					<Button variant="link" size="icon" class="size-5">
						<Play class="max-w-3.5 max-h-3.5" />
					</Button>
				</div> -->
				</div>
			</div>
		{/if}
	</div>
{:else}
	<div class="w-full bg-muted rounded-md p-2">
		<!-- <div class="animate-pulse h-10 bg-gray-200 rounded-md"></div> -->
	</div>
{/if}
