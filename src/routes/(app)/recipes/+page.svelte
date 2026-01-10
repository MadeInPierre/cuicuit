<script lang="ts">
	import { Separator } from '$lib/shared/components/ui/separator';
	import ButtonThemed from '$lib/features/spaces/components/ButtonThemed.svelte';
	import { ArrowRight, BellRing, ChefHat, Funnel, FunnelPlus, Plus } from 'lucide-svelte';
	import RecipeCard from '../../../lib/features/recipes/components/RecipeCard.svelte';
	import ImportRecipeDialog from '$lib/features/recipes/components/ImportRecipeDialog.svelte';
	import {
		getRecipesDetailed,
		type RecipeDetailed
	} from '$lib/features/recipes/queries/get-recipe-detailed';
	import { Button } from '$lib/shared/components/ui/button';
	import ServingsPlusMinus from '$lib/features/recipes/components/ServingsPlusMinus.svelte';
	import { createPersistentState } from '$lib/shared/state/create-persistent-state.svelte';
	import SectionHeader, { type UISectionHeader } from '$lib/shared/components/SectionHeader.svelte';
	import FilterButton from './FilterButton.svelte';
	import DiscoverDial from './DiscoverDial.svelte';
	import { slide } from 'svelte/transition';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import FilterDropdown from './FilterSelect.svelte';
	import {
		recipeCourses,
		recipeCuisines,
		recipeTimesOfDay
	} from '$lib/features/recipes/db/recipe-doc';
	import {
		recipeCoursesSectionHeaders,
		recipeCuisineSectionHeaders,
		recipeTimesOfDaySectionHeaders
	} from '$lib/features/recipes/components/consts';
	import { RotateCcw } from '@lucide/svelte';
	import SearchBar from './SearchBar.svelte';
	import FilterButtonMulti from './FilterButtonMulti.svelte';

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

	// Use a compact encoding: join arrays with ',' and separate keys with '|'
	function encodeFilters(filters: RecipeSearchFilters): string {
		const timeOfDay = filters.timeOfDay.join(',');
		const course = filters.course.join(',');
		const cuisine = filters.cuisine.join(',');
		return `${timeOfDay}|${course}|${cuisine}`;
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
		discover: (page.url.searchParams.get('discover') as DiscoverKey) || 'mixed',
		filters: decodeFilters(page.url.searchParams.get('filters'))
	});

	function setParameters(newParameters: PageParameters) {
		let query = new URLSearchParams(page.url.searchParams.toString());

		if (!newParameters.groupBy || newParameters.groupBy === 'course') {
			query.delete('groupBy');
		} else {
			query.set('groupBy', newParameters.groupBy);
		}

		if (!newParameters.discover || newParameters.discover === 'mixed') {
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
		let query = getRecipesDetailed().limit(100);

		if (searchText) {
			// Remove accents from searchText
			const normalizedSearchText = searchText
				.trim()
				.toLowerCase()
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '');
			query = query.ilike('search_term', `%${normalizedSearchText}%`);
		}

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

		console.log(
			`Fetched recipes with search '${searchText}' and filters:`,
			filters,
			'result:',
			data
		);
		return data;
	}

	/**
	 * STATES
	 */

	let recipes: RecipeDetailed[] = $state([]);
	let loading = $state(true);

	let counter = createPersistentState<number>('global-recipe-page-servings', 2, {
		toString: (value: number) => value.toString(),
		fromString: (value: string) => parseInt(value, 10)
	});

	let searchInput: string = $state('');
	let searchLoading: boolean = $state(false);

	let groupBy = $derived(parameters.groupBy || 'timeOfDay');

	let groupedRecipes: {
		key: string;
		header: UISectionHeader | null;
		recipes: RecipeDetailed[];
	}[] = $derived.by(() => {
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

		const config = groupConfigs[groupBy as keyof typeof groupConfigs] || null;
		if (config) {
			return config.keys.map((key: string) => ({
				key,
				header:
					config.keys.length === 1
						? null
						: config.sectionHeaders[key as keyof typeof config.sectionHeaders],
				recipes: recipes?.filter((recipe) => config.getRecipeKeys(recipe).includes(key)) || []
			}));
		}

		return [
			{
				key: 'all',
				header: null,
				recipes: recipes || []
			}
		];
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
		}
	});

	async function fetchRecipes() {
		const data = await getRecipes(searchInput, parameters.filters, parameters.discover);
		recipes = data || [];
		searchLoading = false;
		loading = false;
	}

	// Search recipes with text search and filters when the search input
	// or filters change, and on the first page load
	let _firstRun = $state(true);
	$effect(() => {
		// Trigger this effect when searchInput or filters change
		searchInput;
		parameters.filters;
		parameters.discover;

		// Show loading indicator on the search bar
		if (searchInput) searchLoading = true;

		// Fetch recipes with text search and filters
		let timeout: any;
		if (_firstRun) {
			_firstRun = false;
			fetchRecipes();
		} else timeout = setTimeout(fetchRecipes, 500); // Debounce search input

		// Debounce search input
		return () => clearTimeout(timeout);
	});
</script>

<div class="space-y-8 pb-16 min-h-full">
	<div class="space-y-6">
		<div class="flex items-center">
			<div class="grid space-y-0.5">
				<div class="flex gap-6 items-center">
					<h1 class="text-4xl font-bold tracking-tight">Ideas for</h1>
					<ServingsPlusMinus value={counter.value || 1} size="lg" onChange={counter.set} />

					<!-- <Button>
						<RotateCcw class="size-4" />
						New search
					</Button> -->
				</div>

				<p class="flex gap-1.5 items-center text-muted-foreground">
					<span class="py-1">Find recipes grouped by</span>
					<FilterDropdown
						value={parameters.groupBy}
						onChange={(value) => setParameters({ ...parameters, groupBy: value as GroupByKey })}
					/>
					<!-- <Button size="sm" class="h-7 ml-1">
						<Save class="size-4" />
						Save view
					</Button> -->
				</p>
			</div>

			<div class="hidden sm:grid ml-auto space-y-3">
				<div class="flex gap-2 justify-end">
					<!-- <Button variant="outline" size="icon">
						<Funnel />
					</Button> -->

					<!-- <DiscoverDial
						value={parameters.discover}
						onChange={(value) => setParameters({ ...parameters, discover: value })}
					/> -->

					<SearchBar class="h-10 w-40 lg:w-80" bind:value={searchInput} loading={searchLoading} />

					<ImportRecipeDialog dropdownAlign="end">
						{#snippet trigger({ props })}
							<ButtonThemed {...props}>
								<Plus class="size-4 mr-2" />
								Add
							</ButtonThemed>
						{/snippet}
					</ImportRecipeDialog>
				</div>

				<div class="flex justify-end gap-2">
					{#if searchInput || parameters.filters.timeOfDay.length > 0 || parameters.filters.course.length > 0 || parameters.filters.cuisine.length > 0}
						<Button
							variant="ghost"
							class="h-7 px-2 text-muted-foreground"
							onclick={() => {
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
						>
							<RotateCcw class="size-4" />
						</Button>
					{/if}

					<FilterButtonMulti
						title="course"
						options={Object.entries(recipeCourses).map(([value, label]) => ({
							value,
							label
						}))}
						defaultValue={['main']}
						values={parameters.filters.course}
						onChange={(values) => {
							setParameters({ ...parameters, filters: { ...parameters.filters, course: values } });
						}}
					/>

					<FilterButtonMulti
						title="cuisine"
						options={Object.entries(recipeCuisines).map(([value, label]) => ({
							value,
							label
						}))}
						defaultValue={['french']}
						values={parameters.filters.cuisine}
						onChange={(values) => {
							setParameters({ ...parameters, filters: { ...parameters.filters, cuisine: values } });
						}}
					/>

					<!-- <FilterButton text="Ready to cook" />
					<FilterButton text="My Recipes" />
					<FilterButton text="Quick & Easy" />
					<FilterButton text="Expire soon" /> -->
					<FilterButton icon={FunnelPlus} primary />
				</div>
			</div>
		</div>

		<Separator class="my-6" />
	</div>

	{#if loading}
		{#each groupedRecipes as sectionRecipes (sectionRecipes.key)}
			<div class="space-y-6 animate-pulse">
				<div class="flex justify-between items-center">
					{#if sectionRecipes.header}
						<SectionHeader header={sectionRecipes.header} />
						<div class="h-8 w-20 bg-muted rounded"></div>
					{:else}
						<div class="h-8 w-40 bg-muted rounded"></div>
					{/if}
				</div>
				<div class="w-full flex gap-4">
					{#each Array(4) as _, i}
						<RecipeCard />
					{/each}
				</div>
			</div>
		{/each}
	{:else if recipes && recipes?.length > 0}
		{#each groupedRecipes as sectionRecipes (sectionRecipes.key)}
			{#if sectionRecipes.recipes.length > 0}
				<div class="space-y-2" transition:slide>
					{#if sectionRecipes.header}
						<div class="flex justify-between items-center">
							<SectionHeader header={sectionRecipes.header} />

							<Button
								variant="link"
								size="sm"
								class="flex items-center"
								onclick={() => {
									console.log('See all for', parameters.groupBy, sectionRecipes.key);
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
						</div>
					{/if}

					<div class="w-full flex flex-wrap gap-4">
						{#each sectionRecipes.recipes as recipe (recipe.id)}
							{#if Math.random() < 0.8}
								<RecipeCard {recipe} showAddToPlanButton class="mt-4" />
							{:else}
								<div
									class="grid space-y-1 p-2 rounded-2xl bg-gradient-to-br from-yellow-200/60 to-yellow-200 dark:from-yellow-900/90 dark:to-yellow-900"
								>
									<div class="bg-background rounded-2xl shadow-md p-2 pb-0">
										<RecipeCard {recipe} showAddToPlanButton />
									</div>
									<div
										class="p-2 pb-1 flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300"
									>
										<BellRing class="size-4" />
										<span><strong>2</strong> ingredients expire soon!</span>

										<!-- <Star class="size-4" />
										<span class="">You love this recipe!</span> -->

										<Button
											size="icon"
											variant="link"
											class="ml-auto w-6 h-6 text-yellow-700 dark:text-yellow-300"
										>
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
		<div class="flex flex-col items-center max-w-60 mx-auto my-32">
			<ChefHat class="size-16 text-slate-300" />

			<p class="mt-4 mb-16 text-muted-foreground text-center text-balance">
				<strong>No recipes found.</strong>
				Start by adding one!
			</p>

			{#if Object.values(parameters.filters).some((value) => value.length > 0)}
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
			{/if}
		</div>
	{/if}
</div>
