<script lang="ts">
	import RecipeCard from '$lib/features/recipes/components/RecipeCard.svelte';
	import ShoppingItemCard from '$lib/features/recipes/components/ShoppingItemCard.svelte';
	import { capitalize } from '$lib/utils';
	import { LoaderCircle } from '@lucide/svelte';
	import { Bird, Search } from '@lucide/svelte';
	import { slide } from 'svelte/transition';
	import type { SearchResults } from './SearchLogic.svelte';

	type Props = {
		inputValue: string;
		inputRef: HTMLElement | null;
		searchResults: SearchResults | null;
		onSelectIngredient: Function;
		onSelectRecipe: Function;
		loading?: boolean;
	};

	let {
		inputValue = $bindable(''),
		inputRef = $bindable(null),
		searchResults = $bindable(null),
		loading = false,
		onSelectIngredient,
		onSelectRecipe
	}: Props = $props();
</script>

{#if searchResults}
	<div class="grid space-y-3" transition:slide={{ duration: 200 }}>
		{#if searchResults.processedIngredient}
			<div
				class="grid w-full gap-2 self-start content-start auto-rows-min"
				style="grid-template-columns: repeat(4, 1fr);"
			>
				{#each searchResults.processedIngredient.matches.slice(0, 3) as ingredient, index (ingredient.id)}
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

				<ShoppingItemCard
					ingredient={undefined}
					description={capitalize(searchResults.processedIngredient.parsed.ingredientText)}
					onclick={(e) => {
						e.preventDefault(); // Avoid submitting the form
						onSelectIngredient(null);
					}}
					size="sm"
				/>
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

		{#if searchResults.recipes && searchResults.recipes.length > 0}
			<div class="grid space-y-2" transition:slide={{ duration: 200 }}>
				{#each searchResults.recipes.slice(0, 2) as recipe (recipe.id)}
					<RecipeCard
						{recipe}
						onclick={() => {
							onSelectRecipe(recipe);
						}}
					/>
				{/each}
			</div>
		{/if}
	</div>
{/if}
