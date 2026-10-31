<script lang="ts">
	import { page } from '$app/state';
	import { PUBLIC_SUPABASE_URL } from '$env/static/public';
	import { getRecipeImageUrl } from '$lib/core/operations/recipes/image-shared.js';
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import { addRecipeToActivePlan } from '$lib/features/plans/actions/add-recipe-to-plan';
	import { deleteMeal, updateMealServings } from '$lib/features/plans/actions/update-meal';
	import MealCard from '$lib/features/plans/components/MealCard.svelte';
	import { IMPORT_STEPS } from '$lib/features/recipes/actions/run-recipe-import';
	import ImportRecipeStepper from '$lib/features/recipes/components/ImportRecipeStepper.svelte';
	import KeepScreenOn from '$lib/features/recipes/components/KeepScreenOn.svelte';
	import RecipeFiltersGrid from '$lib/features/recipes/components/RecipeFiltersGrid.svelte';
	import RecipeImage from '$lib/features/recipes/components/RecipeImage.svelte';
	import RecipeStep from '$lib/features/recipes/components/RecipeStep.svelte';
	import RecipeTimesBar from '$lib/features/recipes/components/RecipeTimesBar.svelte';
	import ServingsPlusMinus from '$lib/features/recipes/components/ServingsPlusMinus.svelte';
	import ShoppingItemCard from '$lib/features/recipes/components/ShoppingItemCard.svelte';
	import {
		getRecipeDetailed,
		type RecipeDetailedWithAuthor,
		type RecipeIngredientDetailed
	} from '$lib/features/recipes/queries/get-recipe-detailed';
	import { recipeImportState } from '$lib/features/recipes/state/recipe-import.svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import UserAvatar from '$lib/features/user-settings/components/UserAvatar.svelte';
	import { Button } from '$lib/shared/components/ui/button/index.js';
	import * as Carousel from '$lib/shared/components/ui/carousel/index.js';
	import { Skeleton } from '$lib/shared/components/ui/skeleton/index.js';
	import VoteForFeatures from '$lib/shared/components/VoteForFeatures.svelte';
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';
	import { normalizeLanguageCode } from '$lib/shared/language.js';
	import { createPersistentState } from '$lib/shared/state/create-persistent-state.svelte';
	import { formatQuantity, isPluralAmount } from '$lib/shared/utils/format-quantity';
	import {
		youtubeUrlToThumbnailUrl,
		youtubeWidescreenThumbnailFallbacks
	} from '$lib/shared/utils/youtube';
	import {
		ArrowUpRight,
		CalendarPlus,
		Camera,
		Grid3x3,
		List,
		Pencil,
		RotateCcw
	} from '@lucide/svelte';
	import posthog from 'posthog-js';
	import SeparatorZigZag from '../../shopping-list/SeparatorZigZag.svelte';

	const pageRecipeId = $derived(page.params.id);
	const importing = $derived(!!pageRecipeId && recipeImportState.isImportingRecipe(pageRecipeId));
	const space = getActiveSpaceState();
	const userState = getUserState();
	const recipeLang = $derived(normalizeLanguageCode(space.language?.lang));

	let ingredientsView = createPersistentState<'grid' | 'list'>(
		'view-recipe-ingredients-layout',
		'grid'
	);

	async function getRecipe(id: string) {
		const lang = normalizeLanguageCode(space.language?.lang);
		if (!lang) {
			// Active space not ready yet (e.g. hard reload); retry once it loads.
			return undefined;
		}

		const { data: recipeData, error } = await getRecipeDetailed(id, lang);

		if (error) {
			console.error('Error fetching recipe:', error);
			return null;
		}

		return recipeData;
	}

	let recipe: RecipeDetailedWithAuthor | undefined | null = $state(undefined);
	let recipeError = $state<string | null>(null);

	let displayServings = $state(1);
	let ytFallbackStep = $state(0);

	let fetchId = 0;
	$effect(() => {
		if (!pageRecipeId) {
			console.error('No recipe ID found in page parameters');
			return;
		}

		if (importing) {
			fetchId++;
			recipe = undefined;
			recipeError = null;
			return;
		}

		const currentFetch = ++fetchId;
		recipeError = null;
		getRecipe(pageRecipeId).then((result) => {
			if (currentFetch !== fetchId) return;
			recipe = result;
			recipeError =
				result === null ? 'This recipe may still be importing, or the link is invalid.' : null;
			displayServings = result?.servings || 1;
			ytFallbackStep = 0;
		});
	});

	$effect(() => {
		if (importing) {
			const s = recipeImportState.preview.metadata?.servings;
			if (s) displayServings = s;
		}
	});

	async function addRecipeToPlan() {
		if (!recipe!.id) return;

		await addRecipeToActivePlan(space, recipe!.id, displayServings);
		posthog.capture('recipe_added_to_plan', {
			servings: displayServings
		});
	}

	const media = useMedia();

	const loading = $derived(!importing && recipe === undefined && !recipeError);

	const previewIngredients = $derived(
		recipeImportState.preview.matched ?? recipeImportState.preview.ingredients
	);
</script>

{#if recipeError && !importing}
	<div class="w-full flex flex-col items-center justify-center h-screen gap-4 px-4 text-center">
		<h1 class="text-2xl font-bold">Recipe not found</h1>
		<p class="max-w-md text-muted-foreground">{recipeError}</p>
		<Button href="/recipes">Back to recipes</Button>
	</div>
{:else}
	<div class="w-full flex flex-col mb-20">
		<main class="grid flex-1 items-start gap-4 md:gap-8">
			<div class="mx-auto grid max-w-236 flex-1 auto-rows-max gap-4">
				<div class="grid gap-12 lg:grid-cols-[1fr_250px] xl:grid-cols-3 lg:gap-8">
					<div class="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
						{#if importing}
							<div class="relative w-full aspect-[1.618] overflow-hidden rounded-md bg-muted">
								{#if recipeImportState.imageId && recipeImportState.recipeId}
									<img
										src={getRecipeImageUrl(
											PUBLIC_SUPABASE_URL,
											recipeImportState.recipeId,
											recipeImportState.imageId,
											'full'
										)}
										alt="Recipe"
										class="size-full object-cover blur-sm scale-110"
									/>
								{/if}
								
								<div
									class="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-max grid place-items-center gap-2 p-4 rounded-lg bg-white/90"
								>
									<span class="font-medium">Importing...</span>
									<ImportRecipeStepper
										steps={IMPORT_STEPS}
										currentStep={recipeImportState.currentStep}
									/>
								</div>
							</div>
						{:else if loading}
							<Skeleton class="w-full aspect-[1.618] rounded-md" />
						{:else if recipe && (recipe.image_ids?.length || 0) > 0}
							<Carousel.Root class="w-full relative">
								<Carousel.Content>
									{#each recipe!.image_ids || [] as imgId (imgId)}
										<Carousel.Item class="w-full">
											<RecipeImage
												{recipe}
												ingredients={recipe!.ingredients}
												variant="full"
												class="w-full aspect-[1.618] object-cover rounded-md size-auto"
											/>
										</Carousel.Item>
									{/each}
								</Carousel.Content>

								<div
									class="absolute top-4 right-4 bg-black/40 text-white flex items-center px-2 py-0.5 rounded-sm"
								>
									{recipe!.image_ids?.length || 1}
									<Camera class="size-4 ml-1.5" />
								</div>

								{#if (recipe!.image_ids?.length || 1) > 1}
									<Carousel.Previous class="absolute left-4" />
									<Carousel.Next class="absolute right-4" />
								{/if}
							</Carousel.Root>
						{:else if recipe && recipe.source_url?.includes('youtu')}
							<img
								src={youtubeUrlToThumbnailUrl(recipe!.source_url)}
								class="w-full aspect-[1.618] object-cover rounded-md"
								alt="Youtube Thumbnail"
								onerror={(e) => {
									const fallback = youtubeWidescreenThumbnailFallbacks(recipe!.source_url ?? '')[
										ytFallbackStep++
									];
									if (fallback) (e.currentTarget as HTMLImageElement).src = fallback;
								}}
							/>
						{:else}
							<!-- no image -->
						{/if}

						{#if importing}
							{#if recipeImportState.preview.metadata}
								{@const metadata = recipeImportState.preview.metadata}
								<div class="space-y-2">
									<h1 class="text-3xl font-bold">{recipeImportState.title}</h1>
									<h3 class="text-sm sm:text-base text-muted-foreground text-justify">
										{metadata.description || ''}
									</h3>

									<div class="flex">
										<div
											class="mr-auto flex items-center gap-2 p-1 rounded-sm text-sm text-muted-foreground"
										>
											<Skeleton class="size-5 rounded-full" />
											<span>Importing…</span>
										</div>
									</div>
								</div>

								<RecipeTimesBar
									prep={metadata.time_prep_minutes}
									cook={metadata.time_cook_minutes}
									rest={metadata.time_rest_minutes}
									total={(metadata.time_prep_minutes || 0) +
										(metadata.time_cook_minutes || 0) +
										(metadata.time_rest_minutes || 0)}
								/>

								<RecipeFiltersGrid
									effortLevel={metadata.effort_level}
									cleanupLevel={metadata.cleanup_level}
									skillLevel={metadata.skill_level}
									timesOfDay={metadata.times_of_day}
									cuisines={metadata.cuisines}
									courses={metadata.courses}
								/>
							{:else}
								<div class="space-y-2">
									<Skeleton class="h-9 w-2/3" />
									<Skeleton class="h-4 w-full" />
									<Skeleton class="h-4 w-5/6" />
									<Skeleton class="h-5 w-40" />
								</div>

								<RecipeTimesBar prep={null} cook={null} rest={null} total={null} />

								<RecipeFiltersGrid
									effortLevel={null}
									cleanupLevel={null}
									skillLevel={null}
									timesOfDay={null}
									cuisines={null}
									courses={null}
								/>
							{/if}
						{:else if loading}
							<div class="space-y-2">
								<Skeleton class="h-9 w-2/3" />
								<Skeleton class="h-4 w-full" />
								<Skeleton class="h-4 w-5/6" />
								<Skeleton class="h-5 w-40" />
							</div>

							<RecipeTimesBar prep={null} cook={null} rest={null} total={null} />

							<RecipeFiltersGrid
								effortLevel={null}
								cleanupLevel={null}
								skillLevel={null}
								timesOfDay={null}
								cuisines={null}
								courses={null}
							/>
						{:else if recipe}
							<div class="space-y-2">
								<h1 class="text-3xl font-bold">{recipe!.title || 'Loading...'}</h1>
								<h3 class="text-sm sm:text-base text-muted-foreground text-justify">
									{recipe!.description || ''}
								</h3>

								<div class="flex">
									<div class="mr-auto flex items-center gap-2 p-1 rounded-sm text-sm">
										<UserAvatar profile={recipe!.author} class="ml-auto size-5" />
										<span>
											{recipe!.source_url ? 'Imported' : 'Created'}
											by {'@' + recipe!.author.user_name}
										</span>
									</div>
									{#if recipe!.source_url}
										<Button
											class="p-0 gap-1"
											variant="link"
											href={recipe!.source_url}
											target="_blank"
											rel="noopener"
										>
											View on {new URL(recipe!.source_url).hostname.replace(/^www\./, '')}
											<ArrowUpRight class="size-4 inline-block ml-1" />
										</Button>
									{/if}
								</div>
							</div>

							<RecipeTimesBar
								prep={recipe!.time_prep_minutes}
								cook={recipe!.time_cook_minutes}
								rest={recipe!.time_rest_minutes}
								total={recipe!.time_total_minutes || 0}
							/>

							<RecipeFiltersGrid
								effortLevel={recipe!.effort_level}
								cleanupLevel={recipe!.cleanup_level}
								skillLevel={recipe!.skill_level}
								timesOfDay={recipe!.times_of_day}
								cuisines={recipe!.cuisines}
								courses={recipe!.courses}
							/>
						{/if}

						{#if media.md}
							{@render stepsSection()}
						{/if}
					</div>

					<div class="grid auto-rows-max items-start gap-x-4 gap-y-12">
						<div class="grid space-y-4">
							<div class="flex gap-2 items-center">
								<h2 class="text-xl font-semibold">Your plan</h2>

								{#if importing || loading}
									<Skeleton class="h-8 w-24 ml-auto" />
								{:else if recipe}
									<Button size="sm" type="submit" class="flex ml-auto" onclick={addRecipeToPlan}>
										<CalendarPlus class="size-4" />

										<div class="flex items-center gap-0.5">Add to plan</div>
									</Button>
								{/if}
							</div>

							{#if importing || loading}
								<Skeleton class="h-24 w-full rounded-md" />
							{:else if recipe}
								{#each (space.activePlanMeals || []).filter((m) => m.recipe_id === recipe!.id) as meal (meal.id)}
									<MealCard
										{meal}
										showExpandedButtons
										expandable={false}
										size={media.md ? 'md' : 'lg'}
									>
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
									</MealCard>
								{:else}
									<div
										class="flex flex-col space-y-2 items-center justify-center text-muted-foreground text-sm p-4 rounded-md border"
									>
										<span>This recipe is not in your plan yet.</span>
									</div>
								{/each}
							{/if}
						</div>

						<div class="grid space-y-4">
							<div class="text-xl font-semibold flex items-center gap-3">
								<span>Cook for</span>

								<ServingsPlusMinus bind:value={displayServings} size="sm" disabled={loading} />

								{#if recipe && displayServings !== recipe!.servings}
									<Button
										variant="ghost"
										size="icon"
										class="mr-auto h-7 w-7 text-muted-foreground"
										onclick={() => (displayServings = recipe?.servings || 1)}
									>
										<RotateCcw class="size-4" />
									</Button>
								{/if}

								<Button
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
								</Button>
							</div>

							{#if importing}
								{#if previewIngredients}
									{@render displayImportIngredients(
										previewIngredients,
										ingredientsView.value || 'grid',
										false
									)}
									{#if previewIngredients.filter((i) => i.isOptional).length > 0}
										<div
											class="flex gap-2 items-center text-sm text-muted-foreground uppercase font-medium tracking-wide"
										>
											<SeparatorZigZag />
											<span>Optional</span>
											<SeparatorZigZag />
										</div>

										{@render displayImportIngredients(
											previewIngredients,
											ingredientsView.value || 'grid',
											true
										)}
									{/if}
								{:else}
									{@render ingredientsSkeleton(ingredientsView.value || 'grid')}
								{/if}
							{:else if loading}
								{@render ingredientsSkeleton(ingredientsView.value || 'grid')}
							{:else if recipe}
								{@render displayIngredients(
									recipe!.ingredients,
									ingredientsView.value || 'grid',
									false
								)}

								{#if recipe!.ingredients.filter((i) => i.is_optional).length > 0}
									<div
										class="flex gap-2 items-center text-sm text-muted-foreground uppercase font-medium tracking-wide"
									>
										<SeparatorZigZag />
										<span>Optional</span>
										<SeparatorZigZag />
									</div>

									{@render displayIngredients(
										recipe!.ingredients,
										ingredientsView.value || 'grid',
										true
									)}
								{/if}
							{/if}
						</div>

						{#if !media.md}
							{@render stepsSection()}
						{/if}

						{#if importing || loading}
							<Skeleton class="h-10 w-full rounded-lg" />
						{:else if recipe}
							<div class="grid space-y-4">
								<Button
									variant="outline"
									href={'/recipes/' + pageRecipeId + '/edit'}
									class="w-full"
									disabled={recipe!.author_id !== userState.user?.id}
								>
									<Pencil class="size-4" />
									{#if recipe!.author_id === userState.user?.id}
										Edit
									{:else}
										Editable by @{recipe!.author.user_name}
									{/if}
								</Button>
							</div>
						{/if}

						{#if !(importing || loading)}
							<KeepScreenOn />

							<VoteForFeatures
								title="Want nutrition facts, custom filters, tags, recipe variants, and more?"
							/>
						{/if}
					</div>
				</div>
			</div>
		</main>
	</div>
{/if}

{#snippet stepsSection()}
	<div class="grid space-y-6">
		<h2 class="text-xl font-semibold">Steps</h2>

		{#if importing}
			{#if recipeImportState.preview.steps}
				{#each recipeImportState.preview.steps as step, i (i)}
					<RecipeStep
						step={{ ...step, ingredients: [] }}
						index={i}
						ingredients={[]}
						lang={normalizeLanguageCode(recipeImportState.preview.lang)}
						{displayServings}
						recipeServings={displayServings}
					/>
				{/each}
			{:else}
				<Skeleton class="h-6 w-16" />
				{#each [0, 1, 2] as i (i)}
					<Skeleton class="h-16 w-full rounded-lg" />
				{/each}
			{/if}
		{:else if loading}
			<Skeleton class="h-6 w-16" />
			{#each [0, 1, 2] as i (i)}
				<Skeleton class="h-16 w-full rounded-lg" />
			{/each}
		{:else if recipe}
			{#each recipe!.steps || [] as step, i (i)}
				<RecipeStep
					{step}
					index={i}
					ingredients={recipe!.ingredients ?? []}
					lang={recipeLang}
					{displayServings}
					recipeServings={recipe!.servings ?? 1}
				/>
			{/each}
		{/if}
	</div>
{/snippet}

{#snippet ingredientsSkeleton(view: 'grid' | 'list')}
	<div class="w-full grid gap-2" class:grid-cols-3={view === 'grid'}>
		{#each [0, 1, 2, 3, 4, 5] as i (i)}
			{#if view === 'grid'}
				<Skeleton class="h-28 w-full rounded-lg" />
			{:else}
				<Skeleton class="h-16 w-full rounded-lg" />
			{/if}
		{/each}
	</div>
{/snippet}

{#snippet displayImportIngredients(
	ingredients: typeof previewIngredients,
	view: 'grid' | 'list',
	optional: boolean
)}
	<div class="w-full grid gap-2" class:grid-cols-3={view === 'grid'}>
		{#each (ingredients ?? [])
			.filter((i) => i.isOptional === optional)
			.sort((a, b) => (b.amount || 0) - (a.amount || 0)) as ing, i (i)}
			{@const amount =
				(ing.amount || 0) * (displayServings / (recipeImportState.preview.metadata?.servings || 1))}
			<ShoppingItemCard
				layout={view}
				name={ing.name}
				description={formatQuantity(amount, ing.unit, true)}
				checkable={false}
			>
				{#if view === 'list'}
					<span class="text-xs text-muted-foreground/80 line-clamp-2"></span>
				{/if}
			</ShoppingItemCard>
		{/each}
	</div>
{/snippet}

{#snippet displayIngredients(
	ingredients: RecipeIngredientDetailed[],
	view: 'grid' | 'list',
	optional: boolean
)}
	<div class="w-full grid gap-2" class:grid-cols-3={view === 'grid'}>
		{#each ingredients
			.filter((i) => i.is_optional === optional)
			.sort((a, b) => (b.quantity || 0) - (a.quantity || 0)) || [] as ing (ing.id)}
			{@const amount = (ing.quantity || 0) * (displayServings / (recipe!.servings || 1))}

			<ShoppingItemCard
				layout={view}
				ingredient={ing.ingredient}
				name={ing.custom_name}
				plural={isPluralAmount(amount)}
				description={formatQuantity(amount, ing.unit, true)}
				checkable={false}
			>
				{#if view === 'list'}
					<span class="text-xs text-muted-foreground/80 line-clamp-2">
						{ing.preparation}{ing.preparation && ing.details ? ', ' : ''}{ing.details}
					</span>
				{/if}
			</ShoppingItemCard>
		{/each}
	</div>
{/snippet}
