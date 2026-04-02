<script lang="ts">
	import type { LanguageKey } from '$lib/features/user-settings/consts';
	import { Input } from '$lib/shared/components/ui/input';
	import { slide } from 'svelte/transition';
	import { capitalize, cn } from '$lib/utils';
	import {
		processIngredientString,
		type IngredientProcessed
	} from '$lib/features/recipes/modules/parse-ingredients/process';
	import ShoppingItemCardGrid from '$lib/features/recipes/components/ShoppingItemCardGrid.svelte';
	import type { Snippet } from 'svelte';
	import { Bird, Search } from 'lucide-svelte';
	import { LoaderCircle } from '@lucide/svelte';
	import {
		getRecipesDetailed,
		type Recipe
	} from '$lib/features/recipes/queries/get-recipe-detailed';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { toast } from 'svelte-sonner';
	import RecipeListItem from '$lib/features/recipes/components/RecipeListItem.svelte';
	import { addRecipeToActivePlan } from '$lib/features/plans/actions/add-recipe-to-plan';

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
		value?: string;
		loading?: boolean;
		class?: string;
		displayRows?: 1 | 2 | 3;
		displayColumns?: number;
		allowCustom?: boolean;
	};

	let {
		onSelect,
		input,
		value = $bindable(''),
		loading = $bindable(false),
		class: className,
		displayRows = 1,
		displayColumns = 3,
		allowCustom = false
	}: Props = $props();

	const space = getActiveSpaceState();

	let processedIngredient: IngredientProcessed | null = $state(null);
	let recipes = $state<Recipe[] | undefined>(undefined);

	let debounceTimeout: NodeJS.Timeout;
	let isSearchFocused = $state(false);
	let hasTypedThisFocus = $state(false);
	const openSearchResults = $derived(
		hasTypedThisFocus || (isSearchFocused && value.trim().length > 0) || value.trim().length > 0
	);

	$effect(() => {
		loading = value.trim().length > 0;

		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(async () => {
			if (!space.activeSpace?.language_id) return;

			// Reset processed input
			if (!value.trim()) {
				processedIngredient = null;
				recipes = undefined;
				return;
			}

			// Process the ingredient string into a structured format matched to the database
			processedIngredient = await processIngredientString(
				value,
				space.activeSpace.language.lang as LanguageKey
			);

			// Also search for recipes
			const { data, error } = await getRecipesDetailed(space.activeSpace.language_id, value).limit(
				3
			);
			if (error) {
				toast.error('Error fetching recipes');
			} else recipes = data ?? undefined;

			// State updates
			hasTypedThisFocus = true; // Fixes escape key details
			loading = false;
		}, 200);
	});

	function onSelectIngredient(chosenIndex: number | null) {
		// Call the provided onSelect callback with the selected ingredient
		onSelect?.(processedIngredient, chosenIndex);

		// Reset the search input and matches
		value = '';
		processedIngredient = null;
	}

	async function onSelectRecipe(recipe: Recipe) {
		await addRecipeToActivePlan(space, recipe.id, 1); // TODO refactor to allow choosing servings & send this function to parent component

		// Reset the search input and matches
		value = '';
		processedIngredient = null;
	}

	$effect(() => {
		isSearchFocused;
		value;
		if (isSearchFocused && value.trim() !== '') {
			hasTypedThisFocus = true;
		}
	});
</script>

<div
	class={cn(
		'grid w-full gap-4 rounded-sm transition-all',
		openSearchResults && 'bg-muted ring-8 ring-muted',
		className
	)}
>
	{#if input}
		{@render input({
			getValue: () => value,
			setValue: (newValue: string) => (value = newValue),
			oninput: (e: InputEvent) =>
				(value = (e.currentTarget as HTMLInputElement | null)?.value ?? ''),
			onfocus: () => (isSearchFocused = true),
			onblur: () => {
				isSearchFocused = false;
				hasTypedThisFocus = false;
			},
			onkeydown: (e: KeyboardEvent) => {
				if (e.key === 'Enter' && processedIngredient?.matches) {
					onSelectIngredient(0);
				}
				if (e.key === 'Escape') {
					if (!value.trim()) {
						isSearchFocused = false;
						hasTypedThisFocus = false;
					} else {
						value = '';
						processedIngredient = null;
					}
				}
			}
		})}
	{:else}
		<Input
			type="text"
			placeholder="3 tomatoes, chopped"
			class="w-full"
			bind:value
			onfocus={() => (isSearchFocused = true)}
			onblur={() => {
				isSearchFocused = false;
				hasTypedThisFocus = false;
			}}
			onkeydown={(e) => {
				if (e.key === 'Enter' && processedIngredient?.matches) {
					onSelectIngredient(0);
				}
				if (e.key === 'Escape') {
					console.log('Escape pressed, closing search results');
					value = '';
					processedIngredient = null;
				}
			}}
		/>
	{/if}

	{#if openSearchResults}
		<div
			class="grid"
			class:h-26={displayRows === 1 && (processedIngredient?.matches.length ?? 0) > 0}
			class:h-54={(displayRows === 2 &&
				(processedIngredient?.matches.length ?? 0) > displayColumns) ||
				!processedIngredient}
			class:h-80={displayRows === 3 &&
				(processedIngredient?.matches.length ?? 0) > displayColumns * 2}
			transition:slide={{ duration: 200 }}
		>
			{#if processedIngredient}
				<div
					class="grid w-full gap-2 self-start content-start auto-rows-min"
					style="grid-template-columns: repeat({displayColumns}, 1fr);"
				>
					{#each processedIngredient.matches.slice(0, displayRows * displayColumns - (allowCustom ? 1 : 0)) as ingredient, index (ingredient.id)}
						<ShoppingItemCardGrid
							{ingredient}
							description={processedIngredient.parsed.description}
							amount={processedIngredient.parsed.quantity?.amount}
							unit={processedIngredient.parsed.quantity?.unitKey === 'whole'
								? ''
								: processedIngredient.parsed.quantity?.unitText}
							onclick={() => onSelectIngredient(index)}
							size="sm"
						/>
					{/each}

					{#if allowCustom}
						<ShoppingItemCardGrid
							ingredient={undefined}
							description={capitalize(processedIngredient.parsed.ingredientText)}
							amount={processedIngredient.parsed.quantity?.amount}
							unit={processedIngredient.parsed.quantity?.unitKey === 'whole'
								? ''
								: processedIngredient.parsed.quantity?.unitText}
							onclick={() => onSelectIngredient(null)}
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
			{:else if value.trim().length > 0}
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
	{/if}

	{#if recipes && recipes.length > 0}
		<div class="grid space-y-2" transition:slide={{ duration: 200 }}>
			{#each recipes as recipe (recipe.id)}
				<RecipeListItem {recipe} onclick={() => onSelectRecipe(recipe)} />
			{/each}
		</div>
	{/if}
</div>
