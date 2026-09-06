<script lang="ts">
	import { addRecipeToActivePlan } from '$lib/features/plans/actions/add-recipe-to-plan';
	import RecipeCard from '$lib/features/recipes/components/RecipeCard.svelte';
	import ShoppingItemCard from '$lib/features/recipes/components/ShoppingItemCard.svelte';
	import { type IngredientProcessed } from '$lib/features/recipes/modules/parse-ingredients/process';
	import type { Recipe } from '$lib/features/recipes/queries/get-recipe-detailed';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { capitalize, cn } from '$lib/utils';
	import { LoaderCircle } from '@lucide/svelte';
	import { Bird, Search } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { slide } from 'svelte/transition';
	import { Input } from '../ui/input';
	import SearchLogic, { type SearchResults } from './SearchLogic.svelte';

	type Props = {
		onSelect: (
			processedIngredient: IngredientProcessed | null,
			chosenMatchIndex: number | null
		) => void;
		input?: Snippet<
			[
				{
					getValue: () => string;
					setValue: (newValue: string) => void;
					oninput: (e: any) => void;
					onfocus: () => void;
					onblur: () => void;
					onkeydown: (e: KeyboardEvent) => void;
				}
			]
		>;
		inputValue?: string;
		loading?: boolean;
		class?: string;
		displayRows?: 1 | 2 | 3;
		displayColumns?: number;
		allowCustom?: boolean;
		display?: 'recipes' | 'ingredients' | 'both';
	};

	let {
		onSelect,
		input,
		inputValue = $bindable(''),
		loading = $bindable(false),
		class: className,
		displayRows = 1,
		displayColumns = 3,
		allowCustom = false,
		display = 'both'
	}: Props = $props();

	const space = getActiveSpaceState();

	let isSearchFocused = $state(false);
	let hasTypedThisFocus = $state(false);
	const openSearchResults = $derived(
		hasTypedThisFocus ||
			(isSearchFocused && inputValue.trim().length > 0) ||
			inputValue.trim().length > 0
	);

	function onSelectIngredient(chosenIndex: number | null) {
		if (!searchResults) return;
		// Call the provided onSelect callback with the selected ingredient
		onSelect?.(searchResults.processedIngredient, chosenIndex);

		// Reset the search input and matches
		inputValue = '';
		searchResults = null;
	}

	async function onSelectRecipe(recipe: Recipe) {
		if (!recipe?.id || !recipe?.servings) return;
		await addRecipeToActivePlan(space, recipe.id, recipe.servings); // TODO refactor to allow choosing servings & send this function to parent component

		// Reset the search input and matches
		inputValue = '';
		searchResults = null;
	}

	$effect(() => {
		isSearchFocused;
		inputValue;
		if (isSearchFocused && inputValue.trim() !== '') {
			hasTypedThisFocus = true;
		}
	});

	let inputRef: HTMLInputElement | null = $state(null);
	let searchResults: SearchResults | null = $state(null);

	const height = $derived.by(() => {
		const matchesCount = searchResults?.processedIngredient?.matches.length ?? 0;

		if (!searchResults?.processedIngredient) return 'h-26';
		if (displayRows === 1 && matchesCount > 0) return 'h-26';
		if (displayRows === 2 && matchesCount > displayColumns) return 'h-54';
		if (displayRows === 3 && matchesCount > displayColumns * 2) return 'h-80';

		return '';
	});
</script>

<SearchLogic bind:inputRef bind:inputValue bind:searchResults {display} />

<div
	class={cn(
		'grid w-full gap-4 rounded-sm transition-all',
		openSearchResults && 'bg-muted ring-8 ring-muted',
		className
	)}
>
	{#if input}
		{@render input({
			getValue: () => inputValue,
			setValue: (newValue: string) => (inputValue = newValue),
			oninput: (e: InputEvent) =>
				(inputValue = (e.currentTarget as HTMLInputElement | null)?.value ?? ''),
			onfocus: () => (isSearchFocused = true),
			onblur: () => {
				isSearchFocused = false;
				hasTypedThisFocus = false;
			},
			onkeydown: (e: KeyboardEvent) => {
				if (e.key === 'Enter' && searchResults?.processedIngredient?.matches) {
					e.preventDefault(); // Avoid submitting the form
					// onSelectIngredient(0);
				}
				if (e.key === 'Escape') {
					if (!inputValue.trim()) {
						isSearchFocused = false;
						hasTypedThisFocus = false;
					} else {
						inputValue = '';
						searchResults = null;
					}
				}
			}
		})}
	{:else}
		<Input
			type="text"
			placeholder="3 tomatoes, chopped"
			class="w-full"
			bind:value={inputValue}
			onfocus={() => (isSearchFocused = true)}
			onblur={() => {
				isSearchFocused = false;
				hasTypedThisFocus = false;
			}}
			onkeydown={(e) => {
				if (e.key === 'Enter' && searchResults?.processedIngredient?.matches) {
					e.preventDefault(); // Avoid submitting the form
					onSelectIngredient(0);
				}
				if (e.key === 'Escape') {
					console.log('Escape pressed, closing search results');
					inputValue = '';
					searchResults = null;
				}
			}}
		/>
	{/if}

	{#if openSearchResults && searchResults}
		<div class={cn('grid', height)} transition:slide={{ duration: 200 }}>
			{#if searchResults.processedIngredient}
				<div
					class="grid w-full gap-2 self-start content-start auto-rows-min"
					style="grid-template-columns: repeat({displayColumns}, 1fr);"
				>
					{#each searchResults.processedIngredient.matches.slice(0, displayRows * displayColumns - (allowCustom ? 1 : 0)) as ingredient, index (ingredient.id)}
						<ShoppingItemCard
							{ingredient}
							description={(searchResults.processedIngredient.parsed.quantity?.amount || '') +
								' ' +
								(searchResults.processedIngredient.parsed.quantity?.unitKey?.replace('whole', '') ||
									'') +
								' ' +
								(searchResults.processedIngredient.parsed.description || '')}
							plural={(searchResults.processedIngredient.parsed.quantity?.amount || 0) > 1}
							onclick={(e) => {
								e.preventDefault(); // Avoid submitting the form
								onSelectIngredient(index);
							}}
							size="sm"
						/>
					{/each}

					{#if allowCustom}
						<ShoppingItemCard
							ingredient={undefined}
							description={capitalize(searchResults.processedIngredient.parsed.ingredientText)}
							onclick={(e) => {
								e.preventDefault(); // Avoid submitting the form
								onSelectIngredient(null);
							}}
							size="sm"
						/>
					{/if}
				</div>
			{:else if loading}
				<div
					class="text-muted-foreground text-sm my-auto flex flex-col items-center justify-center gap-4"
				>
					<LoaderCircle class="size-8 m-2 animate-spin text-muted-foreground" />
					<span>Searching...</span>
				</div>
			{:else if inputValue.trim().length > 0}
				<div
					class="text-muted-foreground text-sm my-auto flex flex-col items-center justify-center gap-4"
				>
					<Bird class="size-12 text-muted-foreground" />
					<span>Oops, no matches found.</span>
				</div>
			{:else}
				<div
					class="text-muted-foreground text-sm my-auto flex flex-col items-center justify-center gap-4 w-40 mx-auto text-balance text-center"
				>
					<Search class="size-8 m-2 text-muted-foreground" />
					<span>Search for any recipe or item</span>
				</div>
			{/if}
		</div>

		{#if searchResults.recipes && searchResults.recipes.length > 0}
			<div class="grid space-y-2" transition:slide={{ duration: 200 }}>
				{#each searchResults.recipes as recipe (recipe.id)}
					<RecipeCard
						{recipe}
						onclick={() => {
							onSelectRecipe(recipe);
						}}
					/>
				{/each}
			</div>
		{/if}
	{/if}
</div>
