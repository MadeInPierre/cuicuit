<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/shared/db/supabase-client';
	import { PUBLIC_SUPABASE_URL } from '$env/static/public';
	import { supermarketAisleSectionHeaders } from '$lib/features/recipes/components/consts';

	async function fetchIngredients({ start = 0, end = 1000 } = { start: 0, end: 1000 }) {
		try {
			const { data, error } = await supabase
				.from('ingredients_with_translations')
				.select('id, hierarchy, aisle, name_singular, name_plural, base_unit, aisle')
				.eq('lang', 'fr-FR')
				.order('name_singular', { ascending: true })
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
	<ul>
		{#each Object.entries(supermarketAisleSectionHeaders) as [aisleKey, aisleHeader] (aisleKey)}
			<li>
				<strong class="text-center w-full">{aisleHeader.title}</strong>
				{#if ingredients.filter((ingredient) => ingredient.aisle === aisleKey).length > 0}
					<div
						style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 1rem; margin-top: 1rem;"
					>
						{#each ingredients.filter((ingredient) => ingredient.aisle === aisleKey) as ingredient}
							<div class="flex flex-col items-center">
								<img
									src={`${PUBLIC_SUPABASE_URL}/storage/v1/object/public/ingredients/images-marmiton/${ingredient.id}.jpg`}
									alt={ingredient.name_singular}
									class="aspect-square w-24 h-24 object-cover rounded-md"
									onerror={(e) => {
										const el = e.currentTarget as HTMLImageElement;
										el.style.display = 'none';
										el.insertAdjacentHTML(
											'afterend',
											`<div class="aspect-square w-24 h-24 rounded-md flex items-center justify-center bg-muted text-xs text-muted-foreground">
                                                No image
                                            </div>`
										);
									}}
								/>
								<div style="margin-top: 0.5rem; text-align: center;">
									{ingredient.name_singular}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</li>
		{/each}
	</ul>
{/if}
