<script lang="ts">
	import { CheckCheck, Circle, Minus, Pencil, Plus, Trash2, Users } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import { PUBLIC_SUPABASE_URL_CLOUD } from '$env/static/public';
	import { Button } from '$lib/shared/components/ui/button';
	import { fade, slide } from 'svelte/transition';
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

	const activeSpace = getActiveSpaceState();

	interface Props {
		meal?: MealWithIngredients | null; // Allow recipe to be null for loading state
		class?: string;
	}

	let { meal = null, class: className = '' }: Props = $props();

	let expanded = $state(true);

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
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<button
			use:dragHandle
			class={cn(
				'flex z-10 w-full items-center p-2 space-x-2 bg-white dark:bg-muted rounded-sm border relative group',
				className
			)}
			onclick={() => (expanded = !expanded)}
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

			<div class="flex gap-1 items-center text-xs font-semibold ml-auto flex-shrink-0 relative">
				<!-- <Button
					class="absolute -top-5 -translate-y-1/2 rounded-full size-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
					variant="outline"
					size="icon"
					onclick={() => {
						updateMealServings(activeSpace, meal.id, meal.servings + 1);
					}}
				>
					<Plus class="size-4" />
				</Button> -->

				<div class="flex items-center gap-1">
					<span>{meal.servings}</span>
					<Users class="size-3 inline-block" />
				</div>

				<!-- <Button
					class="absolute -bottom-5 translate-y-1/2 rounded-full size-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
					variant="outline"
					size="icon"
					onclick={() => {
						if (!meal || !meal.id) return;

						// If servings are 1, delete the meal instead of decrementing
						if (meal.servings <= 1) {
							deleteMeal(activeSpace, meal.id);
							return;
						}

						// Otherwise, decrement the servings
						updateMealServings(activeSpace, meal.id, meal.servings - 1);
					}}
				>
					{#if meal.servings > 1}
						<Minus class="size-4" />
					{:else}
						<Trash2 class="size-4 text-destructive" />
					{/if}
				</Button> -->
			</div>
		</button>

		{#if expanded}
			<div
				class="w-full grid space-y-2 bg-muted rounded-b-sm px-4 pt-3 pb-5 mb-4 -translate-y-1 border relative"
				transition:slide={{ duration: 300 }}
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

				<div class="grid gap-1">
					{#if meal.ingredients.length === 0}
						<p class="text-xs text-muted-foreground">No ingredients found.</p>
					{/if}

					{#each meal.ingredients as ingredient (ingredient.ingredient_id)}
						<div class="flex items-center gap-2 text-xs text-muted-foreground">
							<Circle class="size-3.5 text-muted-foreground" />

							<span class="whitespace-nowrap min-w-0">
								{ingredient.name || ingredient.ingredient?.translations[0]?.name_singular}
								<!-- {ingredient.meal_origin} -->
							</span>

							<span class="ml-auto font-medium line-clamp-1">
								{ingredient.quantity}
								{ingredient.unit === 'whole' ? '' : ingredient.unit}
							</span>

							<!-- <CheckCheck class="size-3.5 text-green-600" /> -->
						</div>
					{/each}
				</div>

				<!-- <Button variant="default" size="sm" class="w-full text-xs flex items-center gap-1">
					<Pencil class="size-3.5" />
					Edit Ingredients
				</Button> -->

				<div
					class="absolute bottom-0 left-1/2 translate-y-1/2 -translate-x-1/2 flex items-center gap-2"
					in:fade={{ delay: 300, duration: 100 }}
				>
					<div class="rounded-full p-1 bg-background border">
						<ServingsPlusMinus
							value={meal.servings}
							size="xs"
							variant="link"
							allowDelete
							onIncrement={() => updateMealServings(activeSpace, meal.id, meal.servings + 1)}
							onDecrement={() => updateMealServings(activeSpace, meal.id, meal.servings - 1)}
							onDelete={() => deleteMeal(activeSpace, meal.id)}
						/>
					</div>
					<div class="rounded-full p-1 bg-background border flex">
						<Button variant="link" size="icon" class="size-5">
							<Pencil class="max-w-3.5 max-h-3.5" />
						</Button>
					</div>
				</div>
			</div>
		{/if}
	</div>
{:else}
	<div class="w-full bg-muted rounded-md p-2">
		<div class="animate-pulse h-10 bg-gray-200 rounded-md"></div>
	</div>
{/if}
