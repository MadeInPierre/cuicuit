<script lang="ts">
	import { supermarketAisleSectionHeaders } from '$lib/features/recipes/components/consts';
	import ShoppingItemCard from '$lib/features/recipes/components/ShoppingItemCard.svelte';
	import { supabase } from '$lib/shared/db/supabase-client';
	import { capitalize } from '$lib/utils';
	import { onMount } from 'svelte';

	async function fetchIngredients({ start = 0, end = 1000 } = { start: 0, end: 1000 }) {
		try {
			const { data, error } = await supabase
				.from('ingredients')
				.select('*, translations:ingredient_translations(*, language:languages!inner(*))')
				.range(start, end);

			if (error) {
				console.error('Error fetching ingredients:', error);
				return [];
			}

			return data;
		} catch (err) {
			error = 'Failed to load ingredients';
			console.error(err);
		}

		return [];
	}
	type Ingredients = typeof fetchIngredients extends () => Promise<infer R> ? R : never;

	let ingredients: Ingredients = [];
	let error: string | null = null;

	const freqOrder = { daily: 0, common: 1, occasionally: 2, rare: 3, never: 4 };

	onMount(async () => {
		ingredients = await fetchIngredients({
			start: 0,
			end: 1000
		});
	});
</script>

{#if error}
	<p class="error">{error}</p>
{:else if ingredients.length === 0}
	<p>No ingredients found.</p>
{:else}
	{#each Object.entries(supermarketAisleSectionHeaders) as [aisleKey, aisleHeader] (aisleKey)}
		{@const aisleIngredients = ingredients.filter((ingredient) => ingredient.aisle === aisleKey)}

		<div class="mb-12 grid space-y-6">
			<strong class="text-4xl font-bold">{aisleHeader.title}</strong>

			{#each Object.keys(freqOrder) as freq}
				{@const freqIngredients = aisleIngredients.filter(
					(ing) => ing.translations[0]?.commonly_used === freq
				)}

				{#if freqIngredients.length > 0}
					<div class="grid">
						<h2 class="font-medium">{capitalize(freq)}</h2>

						<div
							style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.4rem; margin-top: 1rem;"
						>
							{#each freqIngredients.sort((a, b) => {
								// Sort alphabetically
								const aName = a.slug_general ?? '';
								const bName = b.slug_general ?? '';
								return aName.localeCompare(bName);
							}) as ingredient}
								<ShoppingItemCard {ingredient} size="sm" description={ingredient.slug_general} />
							{/each}
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{/each}
{/if}
