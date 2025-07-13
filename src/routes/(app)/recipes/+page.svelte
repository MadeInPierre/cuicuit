<script lang="ts">
	import { Separator } from '$lib/shared/components/ui/separator';
	import ButtonThemed from '$lib/features/spaces/components/ButtonThemed.svelte';
	import { Plus } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { getUserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
	import { collection, getDocs, query } from 'firebase/firestore';
	import { firestore } from '$lib/shared/db/firebase-client';
	import {
		recipeDocConverter,
		recipeTimesOfDay,
		type RecipeDoc
	} from '$lib/features/recipes/db/recipe-doc';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import RecipeCard from './RecipeCard.svelte';
	import ImportRecipeDialog from '$lib/features/recipes/components/ImportRecipeDialog.svelte';
	import { supabase } from '$lib/shared/db/supabase-client';
	import { onMount } from 'svelte';
	import { error } from '@sveltejs/kit';

	// Get all recipes in the firestore recipes/ collection
	async function getRecipes() {
		// Fetch all recipes from Supabase
		const { data: recipeData, error: recipeError } = await supabase
			.from('recipes')
			.select(
				`*, 
				language:languages(*), 
				ingredients:recipe_ingredients(*), 
				courses:recipe_courses(*), 
				cuisines:recipe_cuisines(*), 
				times_of_day:recipe_times_of_day(*), 
				tags:recipe_tags(*), 
				tools:recipe_tools(*)`
			)
			.limit(100);

		if (recipeError) {
			console.error('Error fetching recipes:', recipeError);
			return;
		}

		return recipeData;
	}

	type Recipes = typeof getRecipes extends () => Promise<infer R> ? R : never;

	let recipes: Recipes = $state([]);

	onMount(async () => {
		recipes = await getRecipes();
	});
</script>

<div class="space-y-8 pb-16 min-h-full">
	<div class="space-y-6">
		<div class="flex items-center">
			<div class="space-y-0.5">
				<h2 class="text-2xl font-bold tracking-tight">Recipes</h2>
				<p class="text-muted-foreground">
					Here's your daily dose of inspiration. Add a recipe to get started.
				</p>
			</div>

			<ImportRecipeDialog dropdownAlign="end">
				{#snippet trigger({ props })}
					<ButtonThemed {...props} class="ml-auto">
						<Plus class="size-4 mr-2" />
						Add
					</ButtonThemed>
				{/snippet}
			</ImportRecipeDialog>
		</div>

		<Separator class="my-6" />
	</div>

	{#if recipes && recipes?.length > 0}
		{#each Object.entries(recipeTimesOfDay) as [key, label]}
			{@const categoryRecipes = recipes.filter((recipe) =>
				recipe.times_of_day
					.map((time) => time.timeofday_id)
					.includes(key as keyof typeof recipeTimesOfDay)
			)}

			{#if categoryRecipes.length > 0}
				<div class="space-y-4">
					<h3 class="text-lg font-bold tracking-tight">{label}</h3>

					<div class="w-full flex flex-wrap gap-2">
						{#each categoryRecipes as recipe (recipe.id)}
							<RecipeCard {recipe} />
						{/each}
					</div>
				</div>
			{/if}
		{/each}
	{:else}
		<div class="flex items-center justify-center h-64">
			<p class="text-muted-foreground">No recipes found. Start by adding one!</p>
		</div>
	{/if}
</div>
