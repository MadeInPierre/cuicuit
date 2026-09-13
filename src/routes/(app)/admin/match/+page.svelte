<script lang="ts">
	import { processIngredientStrings } from '$lib/features/recipes/modules/parse-ingredients/process';
	import type { RecipeIngredientWithTranslations } from '$lib/features/recipes/queries/get-recipe-detailed';
	import { supabase } from '$lib/shared/db/supabase-client.svelte';

	const benchmarkIngredients = {
		'en-US': `2 Red bell peppers, diced\n29.57 mL Olive oil\n1 medium Onion, finely chopped\n1 Red bell pepper, diced\n3 Garlic cloves, minced\n4.93 mL Smoked paprika\n1.23 mL Cayenne pepper (optional, for heat)\nSalt, to taste\nFreshly ground black pepper, to taste\n4 large Eggs\n120 mL Greek yogurt (full-fat recommended)\nFresh parsley, chopped, for garnish\nFeta cheese crumbles (optional), for garnish\n1 tablespoon Fresh lemon juice\n0.25 cup Reserved pasta cooking water\n0.25 cup (50g) sugar (adjust for sweetness)\n2 tablespoons Water or milk (only if needed)`,
		'fr-FR': `2 poivrons rouges, coupés en dés\n29,57 mL d'huile d'olive\n1 oignon moyen, finement haché\n1 poivron rouge, coupé en dés\n3 gousses d'ail, hachées\n4,93 mL de paprika fumé\n1,23 mL de piment de Cayenne (facultatif, pour le piquant)\nSel, au goût\nPoivre noir fraîchement moulu, au goût\n4 gros œufs\n120 mL de yaourt grec (de préférence entier)\nPersil frais, haché, pour la garniture\nÉmietté de feta (facultatif), pour la garniture\n1 cuillère à soupe de jus de citron frais\n0,25 tasse d'eau de cuisson des pâtes réservée\n0,25 tasse (50g) de sucre (ajuster selon la douceur)\n2 cuillères à soupe d'eau ou de lait (seulement si nécessaire)`
	};

	let selectedLang = 'en-US';
	let ingredientsText = benchmarkIngredients[selectedLang as keyof typeof benchmarkIngredients];

	let isLoading = false;
	let results: { sourceText: string; match: RecipeIngredientWithTranslations | null }[] = [];

	async function handleMatchIngredients() {
		if (!ingredientsText.trim()) return;
		if (!supabase.client) return;
		isLoading = true;
		results = [];

		const processedIngredients = await processIngredientStrings(
			supabase.client,
			ingredientsText.split('\n'),
			selectedLang
		);

		results = processedIngredients.map((item) => ({
			sourceText: item.sourceText,
			match: item.matches && item.matches.length > 0 ? item.matches[0] : null
		}));

		isLoading = false;
	}

	// Update the textarea when the language changes, but only if the user hasn't edited the text
	$: if (
		selectedLang &&
		(ingredientsText === benchmarkIngredients['en-US'] ||
			ingredientsText === benchmarkIngredients['fr-FR'])
	) {
		ingredientsText = benchmarkIngredients[selectedLang as keyof typeof benchmarkIngredients];
	}

	const languages = {
		'en-US': '🇺🇸 English',
		'fr-FR': '🇫🇷 Français'
	};
</script>

<svelte:head>
	<title>Ingredient Matcher</title>
</svelte:head>

<div class="container">
	<h1>Ingredient Matcher</h1>
	<p>Paste your recipe ingredients below, one per line, and click match.</p>

	<textarea bind:value={ingredientsText} rows="15" placeholder="Paste ingredients here..."
	></textarea>

	<button on:click={handleMatchIngredients} disabled={isLoading}>
		{#if isLoading}
			Matching...
		{:else}
			✨ Match Ingredients
		{/if}
	</button>

	<div style="margin: 1rem 0;">
		<label for="lang-select">Language:</label>
		<select id="lang-select" bind:value={selectedLang}>
			{#each Object.entries(languages) as [code, label]}
				<option value={code}>{label}</option>
			{/each}
		</select>
	</div>

	{#if results.length > 0}
		<h2>Results</h2>
		<ul>
			{#each results as result}
				<li>
					<span>{result.sourceText}</span>
					{#if result.match}
						<span class="match-found">
							✅ Matched: <strong>{result.match.slug}</strong> (General: {result.match
								.slug_general})
						</span>
					{:else}
						<span class="no-match">❌ No Match Found</span>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.container {
		max-width: 800px;
		margin: 2rem auto;
		padding: 0 1rem;
		font-family: sans-serif;
	}
	textarea {
		width: 100%;
		padding: 0.5rem;
		font-size: 1rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		margin-bottom: 1rem;
	}
	button {
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		background-color: #3b82f6;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: background-color 0.2s;
	}
	button:disabled {
		background-color: #9ca3af;
		cursor: not-allowed;
	}
	button:hover:not(:disabled) {
		background-color: #2563eb;
	}
	ul {
		list-style-type: none;
		padding: 0;
		margin-top: 2rem;
	}
	li {
		padding: 0.75rem;
		border-bottom: 1px solid #eee;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.match-found {
		color: #16a34a;
	}
	.no-match {
		color: #dc2626;
	}
</style>
