<script lang="ts">
	import { page } from '$app/state';
	import { addRecipeToActivePlan } from '$lib/features/plans/actions/add-recipe-to-plan';
	import { deleteMeal, updateMealServings } from '$lib/features/plans/actions/update-meal';
	import MealListItem from '$lib/features/plans/components/MealListItem.svelte';
	import RecipeImage from '$lib/features/recipes/components/RecipeImage.svelte';
	import ServingsPlusMinus from '$lib/features/recipes/components/ServingsPlusMinus.svelte';
	import ShoppingItemCardGrid from '$lib/features/recipes/components/ShoppingItemCardGrid.svelte';
	import ShoppingItemCardList from '$lib/features/recipes/components/ShoppingItemCardList.svelte';
	import {
		recipeCourses,
		recipeCuisines,
		recipeTimesOfDay
	} from '$lib/features/recipes/db/recipe-doc';
	import {
		getRecipeDetailed,
		type RecipeDetailedWithAuthor,
		type RecipeIngredientDetailed
	} from '$lib/features/recipes/queries/get-recipe-detailed';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import UserAvatar from '$lib/features/user-settings/components/UserAvatar.svelte';
	import { Button } from '$lib/shared/components/ui/button/index.js';
	import * as Carousel from '$lib/shared/components/ui/carousel/index.js';
	import { createPersistentState } from '$lib/shared/state/create-persistent-state.svelte';
	import { capitalize } from '$lib/utils';
	import {
		ArrowUpRight,
		BatteryFull,
		BicepsFlexed,
		CalendarPlus,
		Camera,
		Equal,
		Globe,
		HandCoins,
		Plus,
		RotateCcw,
		Salad,
		Utensils
	} from 'lucide-svelte';
	import SeparatorZigZag from '../../shopping-list/SeparatorZigZag.svelte';

	const pageRecipeId = $derived(page.params.id);
	const space = getActiveSpaceState();

	let ingredientsView = createPersistentState<'grid' | 'list'>(
		'view-recipe-ingredients-layout',
		'grid'
	);

	async function getRecipe(id: string) {
		if (!space.language) {
			console.error('No active space found');
			return null;
		}

		const { data: recipeData, error: recipeError } = await getRecipeDetailed(id, space.language.id);

		if (recipeError) {
			console.error('Error fetching recipe:', recipeError);
			return null;
		}

		console.log('Fetched recipe from db:', recipeData);
		return recipeData;
	}

	let recipe: RecipeDetailedWithAuthor | undefined | null = $state(undefined);

	let displayServings = $state(1);

	// Fetch the recipe from Supabase when the component mounts or when the pageRecipeId changes
	$effect(() => {
		if (!pageRecipeId) {
			console.error('No recipe ID found in page parameters');
			return;
		}

		getRecipe(pageRecipeId).then((result) => {
			recipe = result;
			displayServings = recipe?.servings || 1;
		});
	});
</script>

{#if recipe}
	<div class="w-full flex flex-col mb-20">
		<main class="grid flex-1 items-start gap-4 md:gap-8">
			<div class="mx-auto grid max-w-236 flex-1 auto-rows-max gap-4">
				<!-- <div class="flex items-center gap-4">
					<Button
						variant="outline"
						size="icon"
						class="h-7 w-7"
						onclick={() => {
							if (window) window.history.back();
						}}
					>
						<ChevronLeft class="h-4 w-4" />
						<span class="sr-only">Back</span>
					</Button>

					<h1
						class="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0"
					>
						Recipe
					</h1>

					{#if doc?.status == 'draft'}
						<Badge class="ml-auto sm:ml-0 bg-yellow-600 text-white dark:bg-yellow-900">Draft</Badge>
					{/if}

					<div class="hidden items-center gap-2 md:ml-auto md:flex">
						{#if doc?.author?.uid == userDocState.user?.uid}
							<Button variant="outline" size="sm" href={'/recipes/' + pageRecipeId + '/edit'}>
								<Pencil class="size-3.5" />
								Edit
							</Button>
						{/if}

						<ButtonThemed size="sm" type="submit" class="flex gap-2">
							<CalendarPlus class="size-4" />
							Add to plan
						</ButtonThemed>
					</div>
				</div> -->

				<div class="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
					<div class="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
						<Carousel.Root class="w-full relative">
							<Carousel.Content>
								{#each recipe.image_ids || [] as imgId, i (imgId)}
									<Carousel.Item>
										<RecipeImage
											{recipe}
											class="w-full aspect-[1.618] object-cover rounded-md size-auto"
										/>
									</Carousel.Item>
								{/each}
							</Carousel.Content>

							<div
								class="absolute top-4 right-4 bg-black/40 text-white flex items-center px-2 py-0.5 rounded-sm"
							>
								{recipe?.image_ids?.length || 1}
								<Camera class="size-4 ml-1.5" />
							</div>

							{#if (recipe?.image_ids?.length || 1) > 1}
								<Carousel.Previous class="absolute left-4" />
								<Carousel.Next class="absolute right-4" />
							{/if}
						</Carousel.Root>

						<div class="space-y-2">
							<h1 class="text-3xl font-bold">{recipe?.title || 'Loading...'}</h1>
							<h3 class="text-lg text-muted-foreground text-justify">
								{recipe?.description || ''}
							</h3>

							<div class="flex">
								<div class="mr-auto flex items-center gap-2 p-1 rounded-sm text-sm">
									<UserAvatar profile={recipe.author} class="ml-auto size-5" />
									<span>
										{recipe.source_url ? 'Imported' : 'Created'}
										by {'@' + recipe.author.user_name}
									</span>
								</div>
								{#if recipe.source_url}
									<Button
										class="p-0 gap-1"
										variant="link"
										href={recipe.source_url}
										target="_blank"
										rel="noopener"
									>
										View on {new URL(recipe.source_url).hostname.replace(/^www\./, '')}
										<ArrowUpRight class="size-4 inline-block ml-1" />
									</Button>
								{/if}
							</div>
						</div>

						<div class="rounded-lg bg-muted flex items-center p-2">
							<div class="w-full flex flex-col">
								<span class="text-[7pt] text-muted-foreground text-center font-bold"> PREP </span>
								<div class="flex justify-center items-center text-center text-xl font-bold h-6">
									{recipe.time_prep_minutes || 0}
									<span class="font-normal text-muted-foreground text-xs ml-1">min</span>
								</div>
							</div>
							<Plus class="min-w-4 size-4 text-muted-foreground" />
							<div class="w-full flex flex-col">
								<span class="text-[7pt] text-muted-foreground text-center font-bold"> COOK </span>
								<div class="flex justify-center items-center text-center text-xl font-bold h-6">
									{recipe.time_cook_minutes || 0}
									<span class="font-normal text-muted-foreground text-xs ml-1">min</span>
								</div>
							</div>
							<Plus class="min-w-4 size-4 text-muted-foreground" />
							<div class="w-full flex flex-col">
								<span class="text-[7pt] text-muted-foreground text-center font-bold"> REST </span>
								<div class="flex justify-center items-center text-center text-xl font-bold h-6">
									{recipe.time_rest_minutes || 0}
									<span class="font-normal text-muted-foreground text-xs ml-1">min</span>
								</div>
							</div>
							<Equal class="min-w-4 size-4" />
							<div class="w-full flex flex-col">
								<span class="text-[7pt] text-muted-foreground text-center font-bold"> TOTAL </span>
								<div class="flex justify-center items-center text-center text-xl font-bold h-6">
									{recipe.time_total_minutes || 0}
									<span class="font-normal text-muted-foreground text-xs ml-1">min</span>
								</div>
							</div>
						</div>

						<div class="grid grid-cols-2 mx-auto lg:grid-cols-3 lg:mx-0 gap-6 justify-items-center">
							{#snippet recipeFilter(Icon: any, title: string, values: string[])}
								<div class="flex gap-4 w-40">
									<div class="min-w-10 h-10 bg-muted rounded-full flex items-center justify-center">
										<Icon class="size-5" />
									</div>
									<div class="w-full flex flex-col gap-0.5">
										<span class="w-full text-xs text-muted-foreground">{title}</span>
										<div class="flex flex-col">
											{#each values as value}
												<span class="text-sm font-semibold">{value}</span>
											{/each}
										</div>
									</div>
								</div>
							{/snippet}

							{@render recipeFilter(BatteryFull, 'Effort', [capitalize(recipe.effort_level)])}
							{@render recipeFilter(HandCoins, 'Cleanup', [capitalize(recipe.cleanup_level)])}
							{@render recipeFilter(BicepsFlexed, 'Skill', [capitalize(recipe.skill_level)])}
							<!-- {@render recipeFilter(BicepsFlexed, 'Cost', capitalize(recipe.cost_level))} -->

							{@render recipeFilter(
								Utensils,
								recipe.times_of_day?.length > 1 ? 'Times of Day' : 'Time of Day',
								recipe.times_of_day?.map(
									(t) => recipeTimesOfDay[t as keyof typeof recipeTimesOfDay]
								) || ['Unknown']
							)}

							{@render recipeFilter(
								Salad,
								'Cuisine',
								recipe.cuisines?.map((c) => recipeCuisines[c as keyof typeof recipeCuisines]) || [
									'Unknown'
								]
							)}

							{@render recipeFilter(
								Globe,
								'Course',
								recipe.courses?.map((c) => recipeCourses[c as keyof typeof recipeCourses]) || [
									'Unknown'
								]
							)}
						</div>

						<div class="grid mt-6 space-y-6">
							<h2 class="text-xl font-semibold">Steps</h2>

							{#each recipe.steps || [] as step, i (step)}
								<div class="flex items-start min-h-12">
									<span
										class="text-md font-semibold text-primary bg-muted rounded-lg size-8 min-w-8 flex justify-center items-center"
									>
										{i + 1}
									</span>
									<span class="ml-4 pt-0.5 text-md">{step}</span>
								</div>
							{/each}
						</div>
					</div>

					<div class="grid auto-rows-max items-start gap-x-4 gap-y-12">
						<div class="grid space-y-4">
							<div class="flex gap-2 items-center">
								<h2 class="text-xl font-semibold">Your plan</h2>

								<Button
									size="sm"
									type="submit"
									class="flex ml-auto"
									onclick={() => recipe && addRecipeToActivePlan(space, recipe.id, displayServings)}
								>
									<CalendarPlus class="size-4" />

									<div class="flex items-center gap-0.5">Add to plan</div>
								</Button>
							</div>

							{#each (space.activePlanMeals || []).filter((m) => recipe && m.recipe_id === recipe.id) as meal (meal.id)}
								<MealListItem {meal} showExpandedButtons expandable={false}>
									{#snippet cardEndSnippet()}
										<ServingsPlusMinus
											value={meal.servings}
											variant="ghost"
											size="xs"
											allowDelete
											onChange={async (newServings) => {
												await updateMealServings(space, meal, newServings);
											}}
											onDelete={async () => {
												await deleteMeal(space, meal.id);
											}}
										/>
									{/snippet}
								</MealListItem>
							{:else}
								<div
									class="flex flex-col space-y-2 items-center justify-center text-muted-foreground text-sm p-4 rounded-md border"
								>
									<span>This recipe is not in your plan yet.</span>
								</div>
							{/each}
						</div>

						<div class="grid space-y-4">
							<div class="text-xl font-semibold flex items-center gap-3">
								<span>Ingredients for</span>

								<ServingsPlusMinus bind:value={displayServings} size="sm" />

								{#if displayServings !== recipe.servings}
									<Button
										variant="ghost"
										size="icon"
										class="ml-auto h-7 w-7 text-muted-foreground"
										onclick={() => (displayServings = recipe?.servings || 1)}
									>
										<RotateCcw class="size-4" />
									</Button>
								{/if}

								<!-- <Button
									variant="ghost"
									size="icon"
									class="ml-auto h-7 w-7"
									onclick={() => {
										ingredientsView.set(ingredientsView.value === 'grid' ? 'list' : 'grid');
									}}
								>
									{#if ingredientsView.value === 'grid'}
										<List class="min-w-4 h-4" />
										<span class="sr-only">Switch to list view</span>
									{:else}
										<Grid3x3 class="min-w-4 h-4" />
										<span class="sr-only">Switch to grid view</span>
									{/if}
								</Button> -->
							</div>

							{@render displayIngredients(
								recipe.ingredients,
								ingredientsView.value || 'grid',
								false
							)}

							{#if recipe.ingredients.filter((i) => i.is_optional).length > 0}
								<div
									class="flex gap-2 items-center text-sm text-muted-foreground uppercase font-medium tracking-wide"
								>
									<SeparatorZigZag />
									<span>Optional</span>
									<SeparatorZigZag />
								</div>

								{@render displayIngredients(
									recipe.ingredients,
									ingredientsView.value || 'grid',
									true
								)}
							{/if}
						</div>

						<!-- <div class="grid space-y-4">
							<h2 class="text-xl font-semibold">Nutrition</h2>
							<div class="grid grid-cols-2 gap-4">TODO</div>
						</div>

						<div class="grid space-y-4">
							<h2 class="text-xl font-semibold">History</h2>
							<div class="grid grid-cols-2 gap-4">TODO History of personal makes</div>
						</div> -->

						<div class="grid space-y-4">
							<Button variant="outline" href={'/recipes/' + pageRecipeId + '/edit'} class="w-full">
								Edit
							</Button>
						</div>
					</div>
				</div>
			</div>
		</main>
	</div>
{:else}
	<div class="w-full flex flex-col items-center justify-center h-screen">
		<h1 class="text-2xl font-bold">Loading recipe...</h1>
		<p class="text-muted-foreground">Please wait while we fetch the recipe details.</p>
	</div>
{/if}

{#snippet displayIngredients(
	ingredients: RecipeIngredientDetailed[],
	view: 'grid' | 'list',
	optional: boolean
)}
	<div class="w-full grid gap-2" class:grid-cols-3={view === 'grid'}>
		{#each ingredients
			.filter((i) => i.is_optional === optional)
			.sort((a, b) => (b.quantity || 0) - (a.quantity || 0)) || [] as ing (ing.ingredient_id)}
			{@const amount = (ing.quantity || 0) * (displayServings / (recipe?.servings || 1))}
			{@const displayAmount = amount > 10 ? Math.round(amount).toString() : amount.toString()}

			{#if view === 'grid'}
				<ShoppingItemCardGrid
					ingredient={ing.ingredient}
					plural={!!ing.quantity && ing.quantity > 1}
					description={displayAmount + ' ' + ing.unit?.replace('whole', '')}
				/>
			{:else}
				<ShoppingItemCardList
					ingredient={ing.ingredient}
					description={ing.raw_input}
					{amount}
					unit={ing.unit === 'whole' ? '' : ing.unit || ''}
				/>
			{/if}
		{/each}
	</div>
{/snippet}
