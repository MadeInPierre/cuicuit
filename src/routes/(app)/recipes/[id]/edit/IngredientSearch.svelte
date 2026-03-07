<script lang="ts">
	import type { LanguageKey } from '$lib/features/user-settings/consts';
	import { Input } from '$lib/shared/components/ui/input';
	import { Label } from '$lib/shared/components/ui/label';
	import { slide } from 'svelte/transition';
	import { cn } from '$lib/utils';
	import {
		processIngredientString,
		type IngredientProcessed
	} from '$lib/features/recipes/modules/parse-ingredients/process';
	import ShoppingListCard from '$lib/features/recipes/components/ShoppingListCard.svelte';

	type Props = {
		language: LanguageKey;
		onSelect: (processedIngredient: IngredientProcessed | null, chosenMatchIndex: number) => void;
		class?: string;
	};

	const { language, onSelect, class: className }: Props = $props();

	let searchInput = $state('');
	let processedIngredient: IngredientProcessed | null = $state(null);
	let debounceTimeout: NodeJS.Timeout;

	$effect(() => {
		searchInput;
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(async () => {
			// Reset processed input
			if (!searchInput.trim()) {
				processedIngredient = null;
				return;
			}

			// Process the ingredient string into a structured format matched to the database
			processedIngredient = await processIngredientString(searchInput, language);
		}, 200);
	});

	function onSelectIngredient(chosenIndex: number) {
		// Call the provided onSelect callback with the selected ingredient
		onSelect?.(processedIngredient, chosenIndex);

		// Reset the search input and matches
		searchInput = '';
		processedIngredient = null;
	}
</script>

<div class={cn('grid w-full', className)}>
	<Input type="text" placeholder="3 tomatoes, chopped" class="w-full" bind:value={searchInput} />

	{#if processedIngredient && processedIngredient.matches && processedIngredient.matches.length > 0}
		<div class="grid" transition:slide>
			<Label class="mt-4 mb-2">Select the best match:</Label>

			<div class="grid w-full gap-4 grid-cols-4">
				{#each processedIngredient.matches.slice(0, 4) as ingredient, index (ingredient.id)}
					<ShoppingListCard
						{ingredient}
						amount={processedIngredient.parsed.quantity?.amount}
						unit={processedIngredient.parsed.quantity?.unitKey === 'whole'
							? ''
							: processedIngredient.parsed.quantity?.unitText}
						onclick={() => onSelectIngredient(index)}
						size="md"
					/>
				{/each}
			</div>
		</div>
	{:else if searchInput}
		<div class="flex items-center justify-center py-4 text-muted-foreground text-sm">
			No matches found.
		</div>
	{/if}
</div>
