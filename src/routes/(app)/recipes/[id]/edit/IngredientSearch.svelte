<script lang="ts">
	import type { LanguageKey } from '$lib/features/user-settings/consts';
	import { Input } from '$lib/shared/components/ui/input';
	import { parseIngredientSearchInput, type ParsedSearchInput } from './_parse-ingredient-input';
	import { supabase } from '$lib/shared/db/supabase-client';
	import { PUBLIC_SUPABASE_URL_CLOUD } from '$env/static/public';
	import type { Tables } from '$lib/shared/db/supabase.types';
	import { Label } from '$lib/shared/components/ui/label';
	import { Button } from '$lib/shared/components/ui/button';
	import { slide } from 'svelte/transition';
	import { cn } from '$lib/utils';
	import { matchIngredients } from '$lib/features/recipes/actions/match-ingredients';

	const {
		language,
		onSelect,
		class: className
	}: {
		language: LanguageKey;
		onSelect: ({
			ingredient,
			parsedInput
		}: {
			ingredient: Tables<'ingredient_translations'>;
			parsedInput: ParsedSearchInput | null;
		}) => void;
		class?: string;
	} = $props();

	let searchInput = $state('');
	let matches: Tables<'ingredient_translations'>[] = $state([]);
	let parsedInput: ParsedSearchInput | null = $state(null);
	let isLoading = $state(false);
	let debounceTimeout: NodeJS.Timeout;

	$effect(() => {
		searchInput;
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(async () => {
			if (!searchInput) {
				matches = [];
				parsedInput = null;
				return;
			}
			parsedInput = parseIngredientSearchInput(searchInput);
			if (!parsedInput.parsed.ingredientText) {
				matches = [];
				return;
			}
			isLoading = true;
			try {
				const { data, error } = await matchIngredients(searchInput, language);
				if (error) throw error;
				matches = data?.matches?.[0]?.bestMatches || [];
			} catch (e) {
				matches = [];
			} finally {
				isLoading = false;
			}
		}, 200);
	});

	function onSelectIngredient(ingredient: Tables<'ingredient_translations'>) {
		// Call the provided onSelect callback with the selected ingredient
		if (!ingredient.ingredient_id) return;

		onSelect?.({
			ingredient,
			parsedInput
		});

		// Reset the search input and matches
		searchInput = '';
		matches = [];
		parsedInput = null;
	}
</script>

<div class={cn('grid w-full', className)}>
	<Input type="text" placeholder="3 tomatoes, chopped" class="w-full" bind:value={searchInput} />

	<!-- {#if isLoading}
		<div class="flex items-center justify-center py-4 text-muted-foreground text-sm">
			Loading matches...
		</div> -->
	{#if matches && matches.length > 0}
		<div class="grid" transition:slide>
			<Label class="mt-4 mb-2">Select the best match:</Label>

			<div class="grid w-full space-y-2 bg-background rounded-md">
				<div class="grid gap-4 grid-cols-4">
					{#each matches.slice(0, 4) as ingredient (ingredient.ingredient_id)}
						<Button
							variant="secondary"
							class="p-0 flex-1 text-center text-xs h-32 aspect-square flex flex-col items-center justify-center"
							onclick={() => onSelectIngredient(ingredient)}
						>
							<div class="w-full flex items-center justify-center">
								<img
									src={`${PUBLIC_SUPABASE_URL_CLOUD}/storage/v1/object/public/ingredients/images-marmiton/${ingredient.ingredient_id}.jpg`}
									alt={ingredient.name_singular}
									class="object-fill rounded w-16 h-16"
								/>
							</div>
							<div class="grid font-normal">
								<span class="block text-balance line-clamp-2 px-1">
									<span class="font-medium">
										{parsedInput?.parsed.quantity?.amount ?? 1}
										{parsedInput?.parsed.quantity?.unit ?? ''}
									</span>
									{(parsedInput?.parsed.quantity?.amount || 1) > 1
										? ingredient.name_plural || ingredient.name_singular
										: ingredient.name_singular || ingredient.name_plural}
								</span>
								{#if parsedInput?.parsed.description}
									<span class="text-muted-foreground italic">{parsedInput?.parsed.description}</span
									>
								{/if}
							</div>
						</Button>
					{/each}
				</div>
			</div>
		</div>
	{:else if searchInput}
		<div class="flex items-center justify-center py-4 text-muted-foreground text-sm">
			No matches found.
		</div>
	{/if}
</div>
