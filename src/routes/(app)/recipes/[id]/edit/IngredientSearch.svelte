<script lang="ts">
	import type { LanguageKey } from '$lib/features/user-settings/consts';
	import { Input } from '$lib/shared/components/ui/input';
	import { PUBLIC_SUPABASE_URL_CLOUD } from '$env/static/public';
	import { Label } from '$lib/shared/components/ui/label';
	import { Button } from '$lib/shared/components/ui/button';
	import { slide } from 'svelte/transition';
	import { cn } from '$lib/utils';
	import {
		processIngredientString,
		type IngredientProcessed
	} from '$lib/features/recipes/modules/parse-ingredients/process';

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

	<!-- {#if isLoading}
		<div class="flex items-center justify-center py-4 text-muted-foreground text-sm">
			Loading matches...
		</div> -->
	{#if processedIngredient && processedIngredient.matches && processedIngredient.matches.length > 0}
		<div class="grid" transition:slide>
			<Label class="mt-4 mb-2">Select the best match:</Label>

			<div class="grid w-full space-y-2 bg-background rounded-md">
				<div class="grid gap-4 grid-cols-4">
					{#each processedIngredient.matches.slice(0, 4) as ingredient, index (ingredient.ingredient_id)}
						<Button
							variant="secondary"
							class="p-0 flex-1 text-center text-xs h-32 aspect-square flex flex-col items-center justify-center"
							onclick={() => onSelectIngredient(index)}
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
										{processedIngredient?.parsed.quantity?.amount ?? 1}
										{processedIngredient?.parsed.quantity?.unit ?? ''}
									</span>
									{(processedIngredient?.parsed.quantity?.amount || 1) > 1
										? ingredient.name_plural || ingredient.name_singular
										: ingredient.name_singular || ingredient.name_plural}
								</span>
								{#if processedIngredient?.parsed.description}
									<span class="text-muted-foreground italic">
										{processedIngredient?.parsed.description}
									</span>
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
