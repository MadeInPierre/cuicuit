<script lang="ts">
	import { Button } from '$lib/shared/components/ui/button/index.js';
	import {
		ArrowUpRight,
		BicepsFlexed,
		CalendarPlus,
		Camera,
		Equal,
		ForkKnife,
		Globe,
		Grid,
		HandCoins,
		List,
		Plus,
		Salad
	} from 'lucide-svelte';
	import {
		recipeCourses,
		recipeCuisines,
		recipeTimesOfDay
	} from '$lib/features/recipes/db/recipe-doc';
	import { page } from '$app/state';
	import * as Card from '$lib/shared/components/ui/card/index.js';
	import * as Carousel from '$lib/shared/components/ui/carousel/index.js';
	import ButtonThemed from '$lib/features/spaces/components/ButtonThemed.svelte';
	import { createPersistentState } from '$lib/shared/state/create-persistent-state.svelte';
	import { capitalize } from '$lib/utils';
	import IngredientImage from '$lib/features/recipes/components/IngredientImage.svelte';
	import { onMount } from 'svelte';
	import type { Tables } from '$lib/shared/db/supabase.types';
	import { PUBLIC_SUPABASE_URL } from '$env/static/public';
	import { getRecipeDetailed } from '$lib/features/recipes/queries/get-recipe-detailed';
	import { getUserPublicProfile } from '$lib/features/auth/queries/get-user-public-profile';

	const pageRecipeId = page.params.id;

	let ingredientsView = createPersistentState('view-recipe-ingredients-layout', 'grid');

	async function getRecipe() {
		const { data: recipeData, error: recipeError } = await getRecipeDetailed(pageRecipeId);
		if (recipeError) {
			console.error('Error fetching recipe:', recipeError);
			return;
		}
		console.log('Fetched recipe:', recipeData);
		return recipeData;
	}
	type Recipe = typeof getRecipe extends () => Promise<infer R> ? R : never;

	let recipe = $state<Recipe | null>(null);

	onMount(async () => {
		// Fetch the recipe from Supabase
		recipe = await getRecipe();
	});
</script>

{#if recipe}
	<div class="w-full flex flex-col mb-20">
		<main class="grid flex-1 items-start gap-4 md:gap-8">
			<div class="mx-auto grid max-w-[59rem] flex-1 auto-rows-max gap-4">
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
										<Card.Root>
											<img
												src={`${PUBLIC_SUPABASE_URL}/storage/v1/object/public/recipes/images/${pageRecipeId}/${imgId}`}
												alt="Recipe"
												class="w-full aspect-[1.618] object-cover rounded-md"
											/>
										</Card.Root>
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
							<h3 class="text-lg text-muted-foreground">{recipe?.description || ''}</h3>

							<div class="flex">
								<div class="mr-auto flex items-center gap-2 p-1 rounded-sm text-sm">
									<!-- <UserAvatar profile={doc?.author?.profile} class="ml-auto size-5" /> -->
									<span class="">Added by {'@' + recipe.author.user_name}</span>
								</div>
								{#if recipe.source_type && recipe.source_type != 'user-manual'}
									<Button
										class="p-0 gap-1"
										variant="link"
										href={recipe.source_url}
										target="_blank"
										rel="noopener"
									>
										View on {recipe.source_url?.includes('youtube') ? 'YouTube' : 'website'}
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

						<div class="grid grid-cols-3 gap-6 justify-items-center">
							{#snippet recipeFilter(Icon: any, title: string, values: string[])}
								<div class="flex gap-4 w-40">
									<div class="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
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

							{@render recipeFilter(BicepsFlexed, 'Effort', [capitalize(recipe.effort_level)])}
							<!-- {@render recipeFilter(BicepsFlexed, 'Cost', capitalize(recipe.cost_level))} -->
							{@render recipeFilter(BicepsFlexed, 'Skill', [capitalize(recipe.skill_level)])}
							{@render recipeFilter(HandCoins, 'Cleanup', [capitalize(recipe.cleanup_level)])}

							{@render recipeFilter(
								ForkKnife,
								recipe.times_of_day?.length > 1 ? 'Times of Day' : 'Time of Day',
								recipe.times_of_day?.map(
									(t) => recipeTimesOfDay[t.timeofday_id as keyof typeof recipeTimesOfDay]
								) ?? ['Unknown']
							)}

							{@render recipeFilter(
								Salad,
								'Cuisine',
								recipe.cuisines?.map(
									(c) => recipeCuisines[c.cuisine_id as keyof typeof recipeCuisines]
								) ?? ['Unknown']
							)}

							{@render recipeFilter(
								Globe,
								'Course',
								recipe.courses?.map(
									(c) => recipeCourses[c.course_id as keyof typeof recipeCourses]
								) ?? ['Unknown']
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
								<h2 class="text-xl font-semibold">Plan</h2>

								<ButtonThemed size="sm" type="submit" class="flex gap-2 ml-auto">
									<CalendarPlus class="size-4" />
									Add meal
								</ButtonThemed>
							</div>

							<div
								class="flex flex-col space-y-2 items-center justify-center text-muted-foreground text-sm p-4 rounded-md border"
							>
								<span>This recipe is not in your plan yet.</span>

								<!-- <ButtonThemed size="sm" type="submit" class="flex gap-2 mx-auto">
								<CalendarPlus class="size-4" />
								Add to plan
							</ButtonThemed> -->
							</div>
						</div>

						<div class="grid space-y-4">
							<div class="text-xl font-semibold flex items-center">
								<span>Ingredients</span>

								<Button
									variant="ghost"
									disabled={ingredientsView.value === 'grid'}
									size="icon"
									class="ml-auto h-7 w-7"
									onclick={() => {
										ingredientsView.set('grid');
									}}
								>
									<Grid class="min-w-4 h-4" />
									<span class="sr-only">Grid view</span>
								</Button>
								<Button
									variant="ghost"
									disabled={ingredientsView.value === 'list'}
									size="icon"
									class="h-7 w-7"
									onclick={() => {
										ingredientsView.set('list');
									}}
								>
									<List class="min-w-4 h-4" />
									<span class="sr-only">List view</span>
								</Button>
							</div>

							{#if ingredientsView.value === 'grid'}
								{#snippet ingredientGrid(ing: Tables<'recipe_ingredients'>)}
									<div class="flex-1 text-center">
										<IngredientImage id={ing.ingredient_id} name={ing.raw_input} class="mb-2 p-2" />
										<span class="text-sm font-medium">
											{ing.quantity + ' ' + (ing.unit == 'whole' ? '' : ing.unit)}
										</span>
										<span class="text-xs text-balance line-clamp-2 px-1">{ing.raw_input}</span>
									</div>
								{/snippet}

								<div class="w-full grid grid-cols-3 gap-x-2 gap-y-4">
									{#each recipe.ingredients || [] as ing (ing.ingredient_id)}
										{@render ingredientGrid(ing)}
									{/each}
								</div>
							{:else}
								{#snippet ingredientList(ing: Tables<'recipe_ingredients'>)}
									<div class="flex items-center gap-2">
										<IngredientImage
											id={ing.ingredient_id}
											name={ing.raw_input}
											class="w-12 h-12"
										/>
										<div class="flex-1 ml-4">
											<span class="text-sm font-medium">{ing.raw_input}</span>
											<span class="text-xs text-balance line-clamp-2">
												{ing.quantity + ' ' + (ing.unit == 'whole' ? '' : ing.unit)}
											</span>
										</div>
									</div>
								{/snippet}

								<div class="w-full grid gap-y-2">
									{#each recipe.ingredients || [] as ing (ing.ingredient_id)}
										{@render ingredientList(ing)}
									{/each}
								</div>
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

				<div
					class="justify-center flex-1 items-center gap-0.5 text-center text-xs text-muted-foreground"
				>
					<p>Recipe id: {pageRecipeId}</p>
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
