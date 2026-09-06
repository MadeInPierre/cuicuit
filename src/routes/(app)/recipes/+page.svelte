<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import { addRecipeToActivePlan } from '$lib/features/plans/actions/add-recipe-to-plan';
	import { addExampleRecipes } from '$lib/features/recipes/actions/add-example-recipes.remote';
	import {
		recipeCoursesSectionHeaders,
		recipeCuisineSectionHeaders,
		recipeTimesOfDaySectionHeaders
	} from '$lib/features/recipes/components/consts';
	import ImportRecipeDialog from '$lib/features/recipes/components/ImportRecipeDialog.svelte';
	import { EXAMPLE_RECIPE_URLS } from '$lib/features/recipes/consts/example-recipes';
	import {
		recipeCourses,
		recipeCuisines,
		recipeTimesOfDay
	} from '$lib/features/recipes/db/recipe-doc';
	import {
		getRecipesDetailed,
		type RecipeDetailed
	} from '$lib/features/recipes/queries/get-recipe-detailed';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import type { LanguageKey } from '$lib/features/user-settings/consts';
	import SectionHeader, { type UISectionHeader } from '$lib/shared/components/SectionHeader.svelte';
	import SelectResponsive from '$lib/shared/components/SelectResponsive.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';
	import { createPersistentState } from '$lib/shared/state/create-persistent-state.svelte';
	import { ArrowRight, ChefHat, CookingPot, Loader2, Plus, RotateCcw } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { slide } from 'svelte/transition';
	import SeparatorZigZag from '../shopping-list/SeparatorZigZag.svelte';
	import RecipeCarousel from './RecipeCarousel.svelte';
	import RecipeFilters from './RecipeFilters.svelte';
	import SearchBar from './SearchBar.svelte';

	const userState = getUserState();

	type RecipeSearchFilters = {
		timeOfDay: string[];
		course: string[];
		cuisine: string[];
	};

	type GroupByKey = 'recommended' | 'cookableState' | 'timeOfDay' | 'course' | 'cuisine';
	type DiscoverKey = 'familiar' | 'mixed' | 'discover';
	type PageParameters = {
		groupBy: GroupByKey;
		discover: DiscoverKey;
		filters: RecipeSearchFilters;
	};

	const space = getActiveSpaceState();

	// Use a compact encoding: join arrays with ',' and separate keys with '|'
	function encodeFilters(filters: RecipeSearchFilters): string {
		const timeOfDay = filters.timeOfDay.join(',');
		const course = filters.course.join(',');
		const cuisine = filters.cuisine.join(',');
		return `${timeOfDay}|${course}|${cuisine}`;
	}

	// Return a time-based greeting
	function getGreeting() {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 18) return 'Good afternoon';
		return 'Good evening';
	}

	function decodeFilters(filters: string | null): RecipeSearchFilters {
		if (!filters) return { timeOfDay: [], course: [], cuisine: [] };
		const [timeOfDayStr = '', courseStr = '', cuisineStr = ''] = filters.split('|');
		return {
			timeOfDay: timeOfDayStr ? timeOfDayStr.split(',').filter(Boolean) : [],
			course: courseStr ? courseStr.split(',').filter(Boolean) : [],
			cuisine: cuisineStr ? cuisineStr.split(',').filter(Boolean) : []
		};
	}

	const parameters: PageParameters = $derived({
		groupBy: (page.url.searchParams.get('groupBy') as GroupByKey) || 'course',
		discover: (page.url.searchParams.get('discover') as DiscoverKey) || 'familiar',
		filters: decodeFilters(page.url.searchParams.get('filters'))
	});

	function setParameters(newParameters: PageParameters) {
		let query = new URLSearchParams(page.url.searchParams.toString());

		if (!newParameters.groupBy || newParameters.groupBy === 'course') {
			query.delete('groupBy');
		} else {
			query.set('groupBy', newParameters.groupBy);
		}

		if (!newParameters.discover || newParameters.discover === 'familiar') {
			query.delete('discover');
		} else {
			query.set('discover', newParameters.discover);
		}

		if (Object.values(newParameters.filters).some((arr) => arr.length > 0)) {
			query.set('filters', encodeFilters(newParameters.filters));
		} else {
			query.delete('filters');
		}

		goto(`?${query.toString()}`);
	}

	// Get all recipes in supabase
	async function getRecipes(
		searchText: string = '',
		filters: RecipeSearchFilters | null = null,
		discover: DiscoverKey | null = null
	) {
		if (!space.language) return [];

		let query = getRecipesDetailed(space.language.id, searchText).limit(100);

		if (filters?.timeOfDay && filters?.timeOfDay.length > 0) {
			query = query.overlaps('times_of_day', filters.timeOfDay);
		}
		if (filters?.course && filters?.course.length > 0) {
			query = query.overlaps('courses', filters.course);
		}
		if (filters?.cuisine && filters?.cuisine.length > 0) {
			query = query.overlaps('cuisines', filters.cuisine);
		}

		// TODO add discover dial

		// Fetch all recipes from Supabase
		const { data, error } = await query;

		if (error) {
			console.error('Error fetching recipes:', error);
			return;
		}
		return data;
	}

	/**
	 * STATES
	 */

	let recipes: RecipeDetailed[] = $state([]);
	let loading = $state(true);
	let searchLoading: boolean = $state(false);

	let groupBy = $derived(parameters.groupBy || 'timeOfDay');

	let searchInput: string = $state('');

	let servingsPref = createPersistentState<number>('global-recipe-page-servings', 2, {
		toString: (value: number) => value.toString(),
		fromString: (value: string) => parseInt(value, 10)
	});

	let groupedRecipes: {
		key: string;
		header: UISectionHeader | null;
		recipes: RecipeDetailed[];
	}[] = $derived.by(() => {
		// Define grouping configurations for each groupBy option
		const groupConfigs = {
			timeOfDay: {
				keys: (parameters.filters.timeOfDay.length
					? parameters.filters.timeOfDay
					: Object.keys(recipeTimesOfDay)) as string[],
				sectionHeaders: recipeTimesOfDaySectionHeaders,
				getRecipeKeys: (recipe: RecipeDetailed) => recipe.times_of_day as string[]
			},
			cuisine: {
				keys: (parameters.filters.cuisine.length
					? parameters.filters.cuisine
					: Object.keys(recipeCuisines)) as string[],
				sectionHeaders: recipeCuisineSectionHeaders,
				getRecipeKeys: (recipe: RecipeDetailed) => recipe.cuisines as string[]
			},
			course: {
				keys: (parameters.filters.course.length
					? parameters.filters.course
					: Object.keys(recipeCourses)) as string[],
				sectionHeaders: recipeCoursesSectionHeaders,
				getRecipeKeys: (recipe: RecipeDetailed) => recipe.courses as string[]
			}
		} as const;

		// Get the config for the current groupBy
		const config = groupConfigs[groupBy as keyof typeof groupConfigs] || null;

		// Default: all recipes in one group
		if (!config) return [{ key: 'all', header: null, recipes: recipes || [] }];

		// Group recipes accordingly
		return config.keys.map((key: string) => ({
			key,
			header: Object.keys(config.sectionHeaders).includes(key)
				? config.sectionHeaders[key as keyof typeof config.sectionHeaders]
				: config.sectionHeaders['default'],
			recipes: recipes?.filter((recipe) => config.getRecipeKeys(recipe).includes(key)) || []
		}));
	});

	// If the current groupBy has also exactly 1 active filter of the same type,
	// then the UI will not be interesting (only one category)
	// So we change the groupBy to the next preference
	$effect(() => {
		// All filters have 1 value, do not change groupBy to avoid infinite loop
		if (
			Object.keys(parameters.filters).every(
				(key) => parameters.filters[key as keyof typeof parameters.filters].length === 1
			)
		)
			return;

		if (groupBy === 'timeOfDay' && parameters.filters.timeOfDay.length === 1) {
			setParameters({ ...parameters, groupBy: 'course' });
		} else if (groupBy === 'course' && parameters.filters.course.length === 1) {
			setParameters({ ...parameters, groupBy: 'cuisine' });
		} else if (groupBy === 'cuisine' && parameters.filters.cuisine.length === 1) {
			setParameters({ ...parameters, groupBy: 'timeOfDay' });
		} else {
			// setParameters({ ...parameters, groupBy: 'recommended' });
		}
	});

	async function fetchRecipes() {
		const data = await getRecipes(searchInput, parameters.filters, parameters.discover);
		recipes = data || [];
		searchLoading = false;
		loading = false;
	}

	// Imports the hard-coded example recipes (already in the shared cache, so
	// this is credit-free) and refreshes the page so they show up immediately.
	let addingExamples = $state(false);

	async function onAddExampleRecipes() {
		if (addingExamples || !space.language) return;
		addingExamples = true;
		try {
			const results = await addExampleRecipes({ fallbackLang: space.language.lang });
			await fetchRecipes();

			// The choice is deterministic: the first two recipes of the list
			const urls =
				EXAMPLE_RECIPE_URLS[space.language.lang as LanguageKey] ?? EXAMPLE_RECIPE_URLS['fr-FR']!;

			// Import results come back in URL order, so add the first two to the plan
			for (const result of results.slice(0, Math.min(2, urls.length))) {
				const recipe = recipes.find((r) => r.id === result.id);
				await addRecipeToActivePlan(space, result.id, recipe?.servings ?? 4, {
					hideToast: true,
					skipRefresh: true
				});
			}

			await space.refreshActivePlanMeals({ refreshShoppingList: false });
			await space.refreshActivePlanItems();

			toast.success(`Added ${results.length} example recipes!`);
		} catch (error) {
			console.error(error);
			toast.error('Failed to add example recipes. Please try again.');
		} finally {
			addingExamples = false;
		}
	}

	// Search recipes with text search and filters when the search input or filters change, and on the first page load
	let _firstRun = $state(true);
	$effect(() => {
		// Trigger this effect when searchInput or filters change
		searchInput;
		parameters.filters;
		parameters.discover;

		// Can't load if the active space hasn't loaded yet
		if (!space.language) return;

		// Show loading indicator on the search bar
		if (searchInput) searchLoading = true;

		// Fetch recipes with text search and filters
		let timeout: any;

		timeout = setTimeout(fetchRecipes, _firstRun ? 0 : 200);
		if (_firstRun) _firstRun = false;

		// Debounce search input
		return () => clearTimeout(timeout);
	});

	const media = useMedia();
</script>

<div class="space-y-8 pb-16 min-h-full">
	<div class="space-y-6 mb-12">
		<div class="flex items-center">
			<div class="grid space-y-1">
				<div class="flex gap-6 items-center">
					<h1 class="text-2xl md:text-3xl xl:text-4xl font-bold tracking-tight">
						<span class="hidden md:block">
							{getGreeting()}, {userState.preferences?.first_name || 'Chef'}!
						</span>
						<span class="md:hidden">Recipes</span>
					</h1>
					<!-- <h1 class="text-4xl font-bold tracking-tight">Ideas for</h1>
					<ServingsPlusMinus value={servingsPref.value || 1} size="lg" onChange={servingsPref.set} /> -->

					<!-- <Button>
						<RotateCcw class="size-4" />
						New search
					</Button> -->
				</div>

				<p class="flex gap-1.5 items-center text-muted-foreground">
					<span class="hidden md:block"> Recipes by </span>
					<span class="md:hidden">Grouped by</span>
					<SelectResponsive
						title="Group recipes by..."
						description="Organize your recipes in different ways"
						values={[parameters.groupBy]}
						onChange={(newValues) =>
							setParameters({
								...parameters,
								groupBy: newValues?.[newValues.length - 1] as GroupByKey
							})}
						closeOnSelect
					/>
					<!-- <Button size="sm" class="h-7 ml-1">
						<Save class="size-4" />
						Save view
					</Button> -->
				</p>
			</div>

			<!-- <Button variant="secondary" class="ml-auto sm:hidden" href="/cookbooks">
				<Bookmark class="size-4" />
				Saved
			</Button> -->

			<ImportRecipeDialog>
				{#snippet trigger({ props })}
					<Button {...props} class="ml-auto h-9 rounded-md sm:hidden">
						<Plus class="size-4" />
						Add
					</Button>
				{/snippet}
			</ImportRecipeDialog>

			<div class="hidden sm:grid ml-auto space-y-3">
				<div class="flex gap-2 justify-end">
					<!-- <Button variant="outline" size="icon">
						<Funnel />
					</Button> -->

					<!-- <DiscoverDial
						value={parameters.discover}
						onChange={(value) => setParameters({ ...parameters, discover: value })}
					/> -->

					<SearchBar class="w-40 lg:w-80" bind:value={searchInput} loading={searchLoading} />

					<ImportRecipeDialog>
						{#snippet trigger({ props })}
							<Button {...props} class="h-9 rounded-md">
								<Plus class="size-4" />
								Add
							</Button>
						{/snippet}
					</ImportRecipeDialog>
				</div>

				<RecipeFilters
					align="end"
					filters={parameters.filters}
					onFiltersChange={(newFilters) => {
						setParameters({ ...parameters, filters: newFilters });
					}}
					{searchInput}
					onReset={() => {
						searchInput = '';
						setParameters({
							...parameters,
							filters: {
								timeOfDay: [],
								course: [],
								cuisine: []
							}
						});
					}}
				/>
			</div>
		</div>

		<SeparatorZigZag />

		<div class="relative max-w-100 sm:hidden overflow-hidden">
			<div
				class="overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
			>
				<RecipeFilters
					filters={parameters.filters}
					onFiltersChange={(newFilters) => {
						setParameters({ ...parameters, filters: newFilters });
					}}
					{searchInput}
					onReset={() => {
						searchInput = '';
						setParameters({
							...parameters,
							filters: {
								timeOfDay: [],
								course: [],
								cuisine: []
							}
						});
					}}
				/>
			</div>

			<div
				class="pointer-events-none absolute inset-y-0 right-0 w-4 bg-linear-to-l from-background to-transparent"
			></div>
		</div>
	</div>

	{#if loading}
		{#each groupedRecipes as sectionRecipes (sectionRecipes.key)}
			<div class="grid space-y-4">
				{#if sectionRecipes.header}
					<div class="flex justify-between items-center mb-6">
						<SectionHeader header={sectionRecipes.header} />
						<div class="h-8 w-20 bg-muted rounded"></div>
					</div>
				{:else}
					<div class="h-8 w-40 bg-muted rounded mb-6"></div>
				{/if}

				<RecipeCarousel recipes={[]} />
			</div>
		{/each}
	{:else if recipes && recipes?.length > 0}
		{#each groupedRecipes as sectionRecipes (sectionRecipes.key)}
			{#if sectionRecipes.recipes.length > 0}
				<div class="grid space-y-4" transition:slide>
					{#if sectionRecipes.header}
						<div class="flex justify-between items-center mb-6">
							<SectionHeader header={sectionRecipes.header} />

							{#if sectionRecipes.recipes.length > 4}
								<Button
									variant="link"
									size="sm"
									class="flex items-center"
									disabled={sectionRecipes.recipes.length <= 4}
									onclick={() => {
										setParameters({
											...parameters,
											filters: {
												...parameters.filters,
												[parameters.groupBy]: [sectionRecipes.key]
											}
										});
									}}
								>
									See all
									<ArrowRight class="size-3.5" />
								</Button>
							{/if}
						</div>
					{/if}

					<RecipeCarousel
						recipes={sectionRecipes.recipes}
						expand={(['recommended', 'cookableState'] as GroupByKey[]).includes(
							parameters.groupBy
						) || !media.sm}
						onSeeAll={() => {
							setParameters({
								...parameters,
								filters: {
									...parameters.filters,
									[parameters.groupBy]: [sectionRecipes.key]
								}
							});
						}}
					/>
				</div>
			{/if}
		{/each}
	{:else}
		<div class="bg-sidebar p-6 md:p-12 rounded-lg text-center text-muted-foreground text-sm">
			<ChefHat class="size-12 mx-auto mb-3" />
			<p class="text-lg font-medium">No recipes yet</p>

			{#if Object.values(parameters.filters).some((value) => value.length > 0)}
				<p class="w-40 mx-auto mb-6">Try resetting your filters to get more results.</p>

				<Button
					onclick={() => {
						searchInput = '';
						setParameters({
							...parameters,
							filters: { course: [], cuisine: [], timeOfDay: [] }
						});
					}}
				>
					<RotateCcw class="size-4 mr-2" />
					Reset filters
				</Button>
			{:else}
				<p class="text-sm mx-auto">Start by importing or creating new recipes!</p>

				<div class="flex flex-wrap justify-center gap-2 mt-6">
					<ImportRecipeDialog>
						{#snippet trigger({ props })}
							<Button {...props}>
								<Plus class="size-4" />
								Add a recipe
							</Button>
						{/snippet}
					</ImportRecipeDialog>

					<Button
						variant="outline"
						onclick={onAddExampleRecipes}
						disabled={addingExamples}
						class="text-foreground"
					>
						{#if addingExamples}
							<Loader2 class="size-4 animate-spin" />
							Adding recipes...
						{:else}
							<CookingPot class="size-4" />
							Try examples
						{/if}
					</Button>
				</div>
			{/if}
		</div>
	{/if}
</div>
