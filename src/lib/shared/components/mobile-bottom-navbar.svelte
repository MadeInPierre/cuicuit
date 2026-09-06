<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { addRecipeToActivePlan } from '$lib/features/plans/actions/add-recipe-to-plan';
	import { addShoppingItem } from '$lib/features/plans/actions/add-shopping-item';
	import { selectedMealIngredient } from '$lib/features/plans/state/hovered-meal-ingredient.svelte';
	import type { Recipe } from '$lib/features/recipes/queries/get-recipe-detailed';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { cn } from '$lib/utils';
	import {
		Calendar,
		ChefHat,
		Loader2,
		MessageCircle,
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

<!-- {#if style === 'classic'}
	<nav
		class="sticky bottom-0 z-50 bg-background border-t flex justify-around items-center py-2.5 px-4 md:hidden"
	>
		{@render navItem('Recipes', ChefHat, '/recipes')}
		{@render navItem('Plan', Calendar, '/plan')}
		{@render navItem('Groceries', ShoppingBasket, '/shopping-list')}
		{@render navItem('Pantry', Refrigerator, '/pantry')}
		{@render navItem('Settings', User, '/settings')}
	</nav>
{:else if style === 'float'} -->

<div
	class="z-40 pointer-events-none fixed inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent md:hidden"
></div>

<div
	class="z-50 min-h-18 sticky bottom-6 mx-auto px-6 flex gap-3 max-w-lg md:hidden overflow-x-hidden"
>
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
			'w-18 min-h-18 border border-border/60 flex justify-center items-center rounded-[36px] drop-shadow-md/5 bg-white/90 dark:bg-background/90 backdrop-blur-md ml-auto transition-all',
			openChat && 'w-full'
		)}
	>
		{#if openChat}
			<div class="w-full grid">
				{#if searchResults}
					<span class="p-6 pb-2" transition:slide={{ duration: 150 }}>
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
									<MessageCircle class="size-5" />
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
