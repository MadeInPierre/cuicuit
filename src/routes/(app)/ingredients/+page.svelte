<script lang="ts">
	import { supermarketAisleSectionHeaders } from '$lib/features/recipes/components/consts';
	import ShoppingItemCardGrid from '$lib/features/recipes/components/ShoppingItemCardGrid.svelte';
	import { supabase } from '$lib/shared/db/supabase-client';
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
		<div class="mb-12">
			<strong class="text-4xl mb-4 font-bold text-center w-full">{aisleHeader.title}</strong>

			{#if ingredients.filter((ingredient) => ingredient.aisle === aisleKey).length > 0}
				<div
					style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.4rem; margin-top: 1rem;"
				>
					{#each ingredients
						.filter((ingredient) => ingredient.aisle === aisleKey)
						.sort((a, b) => {
							// Sort by commonly_used first
							const order = { daily: 0, common: 1, occasionally: 2, rare: 3, never: 4 };
							const aRank = order[a.translations?.[0]?.commonly_used ?? ''] ?? 999;
							const bRank = order[b.translations?.[0]?.commonly_used ?? ''] ?? 999;
							if (aRank !== bRank) return aRank - bRank;

							// Then sort alphabetically
							const aName = a.translations?.[0]?.name_singular ?? '';
							const bName = b.translations?.[0]?.name_singular ?? '';
							return aName.localeCompare(bName);
						}) as ingredient}
						<ShoppingItemCardGrid {ingredient} size="sm" />
					{/each}
				</div>
			{/if}
		</div>
	{/each}
{/if}
