<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { addRecipeToActivePlan } from '$lib/features/plans/actions/add-recipe-to-plan';
	import { addShoppingItem } from '$lib/features/plans/actions/add-shopping-item';
	import { selectedMealIngredient } from '$lib/features/plans/state/hovered-meal-ingredient.svelte';
	import type { Recipe } from '$lib/features/recipes/queries/get-recipe-detailed';
	import { recipesSearchState } from '$lib/features/recipes/state/recipes-search.svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { cn } from '$lib/utils';
	import {
		Calendar,
		CalendarPlus,
		ChefHat,
		Delete,
		Loader2,
		Plus,
		Refrigerator,
		Search,
		ShoppingBasket,
		X
	} from '@lucide/svelte';
	import { fade, slide } from 'svelte/transition';
	import SearchInputMobile from './search/SearchInputMobile.svelte';
	import SearchLogic, { type SearchResults } from './search/SearchLogic.svelte';
	import SearchResultsMobile from './search/SearchResultsMobile.svelte';
	import { Button } from './ui/button';

	let { openChat = $bindable(false) } = $props();

	const space = getActiveSpaceState();

	let inputValue = $state('');
	let inputRef: HTMLInputElement | null = $state(null);
	let searching = $state(false);
	let searchResults: SearchResults | null = $state(null);

	// Active recipe search pill, shown above the navbar on the recipes page
	const showRecipeSearch = $derived(
		!openChat &&
			recipesSearchState.searchInput.trim().length > 0 &&
			page.url.pathname.startsWith('/recipes')
	);

	function onSelectIngredient(chosenIndex: number | null) {
		// Call the provided onSelect callback with the selected ingredient
		// onSelect?.(searchResults.processedIngredient, chosenIndex);

		if (!searchResults?.processedIngredient) return;
		const quantity = searchResults.processedIngredient.parsed.quantity?.amount ?? null;
		const unit = searchResults.processedIngredient.parsed.quantity?.unitKey ?? null;
		const name = searchResults.processedIngredient.parsed.ingredientText ?? '';
		const ingredientId =
			chosenIndex !== null
				? (searchResults.processedIngredient.matches[chosenIndex]?.id ?? null)
				: null;

		// Add the item to the shopping list
		addShoppingItem(space, ingredientId, name, quantity, unit);

		// Reset the sidebar view to show all meals and items
		selectedMealIngredient.value = null;

		// Reset the search input and matches
		inputValue = '';
		searchResults = null;
		inputRef?.focus();

		// Go to show the result
		if (
			!page.route.id?.startsWith('/(app)/plan') &&
			!page.route.id?.startsWith('/(app)/shopping-list')
		) {
			goto('/plan');
		}
	}

	async function onSelectRecipe(recipe: Recipe) {
		if (!recipe?.id || !recipe?.servings) return;
		await addRecipeToActivePlan(space, recipe.id, recipe.servings); // TODO refactor to allow choosing servings & send this function to parent component

		// Reset the search input and matches
		inputValue = '';
		searchResults = null;

		// Go to show the result
		if (
			!page.route.id?.startsWith('/(app)/plan') &&
			!page.route.id?.startsWith('/(app)/shopping-list')
		) {
			goto('/plan');
		}
	}

	function onSearchRecipes() {
		recipesSearchState.searchFromNavbar(inputValue);

		// Reset the assistant search input and matches
		inputValue = '';
		searchResults = null;

		// Close the overlay so the user sees the filtered recipes
		openChat = false;
	}

	function openRecipeSearchEditor() {
		// Pre-fill the assistant input so the current search can be edited
		inputValue = recipesSearchState.searchInput;
		openChat = true;
		// Focus the input after opening the chat
		setTimeout(() => {
			inputRef?.focus();
		}, 100);
	}

	function onSelectDefault() {
		if ((searchResults?.processedIngredient?.matches || []).length > 0) {
			onSelectIngredient(0);
		} else if (searchResults?.recipes && searchResults?.recipes.length > 0) {
			onSelectRecipe(searchResults.recipes[0]);
		} else {
			onSelectIngredient(null); // Add a custom item
		}
	}
</script>

<SearchLogic bind:inputRef bind:inputValue bind:searchResults bind:loading={searching} />

{#snippet navItem(label: string, Icon: any, href: string)}
	<a
		{href}
		class="min-w-12 w-full max-w-16 flex flex-col gap-1 items-center justify-center text-xs text-foreground font-medium"
	>
		<div
			class={cn(
				'w-full min-w-12 py-1 rounded-full flex items-center justify-center transition-colors bg-transparent',
				href && page.url.pathname.startsWith(href) && 'bg-primary/20 text-primary'
			)}
		>
			<Icon class="size-6" />
		</div>

		{#if label}
			<span>{label}</span>
		{/if}
	</a>
{/snippet}

<div
	class="z-40 pointer-events-none fixed inset-x-0 bottom-0 h-24 bg-linear-to-t from-background to-transparent md:hidden"
></div>

<div class="z-50 sticky bottom-0 mx-auto px-6 flex flex-col gap-2 max-w-lg md:hidden">
	{#if showRecipeSearch}
		<div
			class="flex items-center gap-1 rounded-full border border-border/60 bg-white/90 dark:bg-background/90 backdrop-blur-md drop-shadow-md/5 py-1.5 pl-4 pr-1.5 text-sm"
		>
			<button
				class="flex min-w-0 flex-1 items-center gap-2 text-left"
				onclick={openRecipeSearchEditor}
				aria-label="Edit recipe search"
			>
				<Search class="size-3.5 shrink-0 text-muted-foreground" />
				<span class="truncate">{recipesSearchState.searchInput}</span>
			</button>
			<Button
				variant="ghost"
				size="icon"
				class="size-7 shrink-0 rounded-full"
				aria-label="Clear recipe search"
				onclick={() => (recipesSearchState.searchInput = '')}
			>
				<X class="size-4" />
			</Button>
		</div>
	{/if}

	<div class="min-h-18 flex gap-3 overflow-x-hidden pb-6">
		{#if !openChat}
			<nav
				class={cn(
					'flex-1 border border-border/60 flex justify-around items-center py-2.5 px-4 rounded-full drop-shadow-md/5 bg-white/90 dark:bg-background/90 backdrop-blur-md'
				)}
				transition:slide={{ axis: 'x', duration: 150 }}
			>
				{@render navItem('Recipes', ChefHat, '/recipes')}
				{@render navItem('Plan', Calendar, '/plan')}
				{@render navItem('List', ShoppingBasket, '/shopping-list')}
				{@render navItem('Pantry', Refrigerator, '/pantry')}
			</nav>
		{/if}

		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class={cn(
				'w-18 min-h-18 border border-border/60 flex justify-center items-center rounded-[36px] drop-shadow-md/5 bg-primary-foreground/90 dark:bg-background/90 backdrop-blur-md ml-auto transition-all',
				openChat && 'w-full'
			)}
		>
			{#if openChat}
				<div class="w-full grid">
					{#if searchResults}
						<span class="grid space-y-3 p-6 pb-2" transition:slide={{ duration: 150 }}>
							<div class="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									class="rounded-full bg-primary-foreground"
									disabled={!inputValue.trim()}
									onclick={onSearchRecipes}
								>
									<Search class="size-3.5" />
									Search recipes
								</Button>

								<Button variant="ghost" size="sm" class="rounded-full" disabled>
									<CalendarPlus class="size-3.5" />
									Or quick add:
								</Button>
							</div>

							<SearchResultsMobile
								bind:searchResults
								bind:inputValue
								bind:inputRef
								{onSelectIngredient}
								{onSelectRecipe}
							/>
						</span>
					{/if}

					<div class="h-18 flex items-center gap-0 px-4">
						<!-- <Button
						variant="secondary"
						size="icon"
						class="size-11 rounded-full shadow-none mr-auto"
						onclick={() => {}}
					>
						<AudioWaveform class="size-5 text-muted-foreground " />
					</Button> -->

						<Button
							disabled
							variant="ghost"
							size="icon"
							class="size-11 rounded-full shadow-none mr-auto"
							onclick={() => {}}
						>
							<Search class="size-5 text-muted-foreground " />
						</Button>

						<div in:fade={{ duration: 150, delay: 150 }} class="flex items-center gap-2 w-full">
							<SearchInputMobile
								bind:ref={inputRef}
								bind:value={inputValue}
								onClose={() => (openChat = false)}
								onEnter={onSelectDefault}
							/>

							<Button
								variant={searchResults ? 'default' : 'ghost'}
								size="icon"
								class="size-11 rounded-full ml-auto"
								disabled={searching}
								onclick={() => {
									if (inputValue) {
										// TODO Handle sending message
										inputValue = '';
										inputRef?.focus();
									} else {
										openChat = false;
									}
								}}
							>
								{#if searching}
									<div in:fade={{ duration: 75, delay: 75 }}>
										<Loader2 class="size-5 animate-spin" />
									</div>
								{:else if inputValue}
									<div in:fade={{ duration: 75, delay: 75 }}>
										<!-- <MessageCircle class="size-5" /> -->
										<Delete class="size-5 -translate-x-px" />
									</div>
								{:else}
									<div in:fade={{ duration: 75, delay: 75 }}>
										<X class="size-5" />
									</div>
								{/if}
							</Button>
						</div>
					</div>
				</div>
			{:else}
				<button
					onclick={() => {
						openChat = true;
						// Focus the input after opening the chat
						setTimeout(() => {
							inputRef?.focus();
						}, 100);
					}}
				>
					{#if page.url.pathname.startsWith('/recipes')}
						<Search class="size-6" />
					{:else}
						<Plus class="size-6" />
						<!-- <MessageCircle class="size-6" /> -->
					{/if}
					<span class="sr-only">Open chat</span>
				</button>
			{/if}
		</div>
	</div>
</div>
