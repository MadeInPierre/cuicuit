<script lang="ts">
	import { Separator } from '$lib/shared/components/ui/separator';
	import ButtonThemed from '$lib/features/spaces/components/ButtonThemed.svelte';
	import { ArrowRight, BellRing, FunnelPlus, Plus, RotateCcw, Star } from 'lucide-svelte';
	import { recipeTimesOfDay, recipeTimesOfDayCards } from '$lib/features/recipes/db/recipe-doc';
	import RecipeCard from '../../../lib/features/recipes/components/RecipeCard.svelte';
	import ImportRecipeDialog from '$lib/features/recipes/components/ImportRecipeDialog.svelte';
	import { onMount } from 'svelte';
	import { getRecipesDetailed } from '$lib/features/recipes/queries/get-recipe-detailed';
	import { Button } from '$lib/shared/components/ui/button';
	import { cn } from '$lib/utils';
	import ServingsPlusMinus from '$lib/features/recipes/components/ServingsPlusMinus.svelte';
	import { createPersistentState } from '$lib/shared/state/create-persistent-state.svelte';

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

	let counter = createPersistentState<number>('global-recipe-page-servings', 2, {
		toString: (value: number) => value.toString(),
		fromString: (value: string) => parseInt(value, 10)
	});

	onMount(async () => {
		recipes = await getRecipes();
		// await new Promise((resolve) => setTimeout(resolve, 3000)); // Simulate loading delay
		loading = false;
	});
</script>

<div class="space-y-8 pb-16 min-h-full">
	<div class="space-y-6">
		<div class="flex items-center">
			<div class="grid space-y-0.5">
				<div class="flex gap-6 items-center">
					<h1 class="text-4xl font-semibold tracking-tight">Ideas for</h1>
					<ServingsPlusMinus value={counter.value || 1} size="lg" onChange={counter.set} />

					<!-- <Button>
						<RotateCcw class="size-4" />
						New search
					</Button> -->
				</div>
				<p class="text-muted-foreground">
					Discover recipes to inspire your next meal. Adjust the servings to see which recipes can
					be cooked right now.
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
			{@const cardInfo = recipeTimesOfDayCards[key as keyof typeof recipeTimesOfDayCards]}
			<div class="space-y-6 animate-pulse">
				<div class="flex justify-between items-center">
					<div class="flex items-center gap-4">
						<div class="w-12 aspect-square bg-muted rounded-md flex items-center justify-center">
							<cardInfo.icon class="size-6 text-muted-foreground" />
						</div>
						<div class="grid">
							<h2 class="text-lg font-bold tracking-tight">{label}</h2>
							<p class="text-muted-foreground text-sm">
								{cardInfo.description}
							</p>
						</div>
					</div>
					<div class="h-8 w-20 bg-muted rounded"></div>
				</div>
				<div class="w-full flex gap-4">
					{#each Array(6) as _, i}
						<RecipeCard />
					{/each}
				</div>
			</div>
		{/each}
	{:else if recipes && recipes?.length > 0}
		{#each Object.entries(recipeTimesOfDay) as [key, label]}
			{@const cardInfo = recipeTimesOfDayCards[key as keyof typeof recipeTimesOfDayCards]}
			{@const categoryRecipes = recipes.filter((recipe) =>
				recipe.times_of_day
					.map((time) => time.timeofday_id)
					.includes(key as keyof typeof recipeTimesOfDay)
			)}

			{#if categoryRecipes.length > 0}
				<div class="space-y-2">
					<div class="flex justify-between items-center">
						<div class="flex items-center gap-4">
							<div
								class={cn(
									'w-12 aspect-square bg-muted rounded-md flex items-center justify-center',
									cardInfo.classes
								)}
							>
								<cardInfo.icon class={cn('size-6 text-muted-foreground', cardInfo.classes)} />
							</div>

							<div class="grid">
								<h2 class="text-lg font-bold tracking-tight">{label}</h2>
								<p class="text-muted-foreground text-sm">{cardInfo.description}</p>
							</div>
						</div>
						<Button variant="link" size="sm" class="flex items-center" href="/recipes">
							See all
							<ArrowRight class="size-3.5" />
						</Button>
					</div>

					<div class="w-full flex flex-wrap gap-4">
						{#each categoryRecipes as recipe (recipe.id)}
							{#if Math.random() < 0.8}
								<RecipeCard {recipe} showAddToPlanButton showDetails class="mt-4" />
							{:else}
								<div
									class="grid space-y-1 p-2 rounded-2xl"
									style="background: linear-gradient(160deg, #fef9c3 0%, #fde68a 100%);"
								>
									<div class="bg-background rounded-2xl shadow-md p-2 pb-0">
										<RecipeCard {recipe} showAddToPlanButton showDetails />
									</div>
									<div class="p-2 pb-1 flex items-center gap-2 text-sm text-yellow-700">
										<BellRing class="size-4" />
										<span><strong>2</strong> ingredients expire soon!</span>
										
										<!-- <Star class="size-4" />
										<span class="">You love this recipe!</span> -->

										<Button size="icon" variant="link" class="ml-auto w-6 h-6 text-yellow-700">
											<FunnelPlus class="size-4" />
										</Button>
									</div>
								</div>
							{/if}
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
