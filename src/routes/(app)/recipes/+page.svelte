<script lang="ts">
	import { Separator } from '$lib/shared/components/ui/separator';
	import ButtonThemed from '$lib/features/spaces/components/ButtonThemed.svelte';
	import { Plus } from 'lucide-svelte';
	import { recipeTimesOfDay } from '$lib/features/recipes/db/recipe-doc';
	import RecipeCard from './RecipeCard.svelte';
	import ImportRecipeDialog from '$lib/features/recipes/components/ImportRecipeDialog.svelte';
	import { onMount } from 'svelte';
	import { getRecipesDetailed } from '$lib/features/recipes/queries/get-recipe-detailed';

	// Get all recipes in supabase
	async function getRecipes() {
		// Fetch all recipes from Supabase
		const { data: recipeData, error: recipeError } = await getRecipesDetailed().limit(100);

		if (recipeError) {
			console.error('Error fetching recipes:', recipeError);
			return;
		}

		return recipeData;
	}

	type Recipes = typeof getRecipes extends () => Promise<infer R> ? R : never;

	let recipes: Recipes = $state([]);
	let loading = $state(true);

	onMount(async () => {
		recipes = await getRecipes();
		loading = false;
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

	{#if loading}
		{#each Object.entries(recipeTimesOfDay) as [key, label]}
			<div class="space-y-4">
				<h3 class="text-lg font-bold tracking-tight">{label}</h3>
				<div class="w-full flex flex-wrap gap-2">
					{#each Array(4) as _, i}
						<RecipeCard />
					{/each}
				</div>
			</div>
		{/each}
	{:else if recipes && recipes?.length > 0}
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
