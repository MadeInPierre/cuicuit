<script lang="ts">
	import type { LanguageKey } from '$lib/features/user-settings/consts';
	import { Input } from '$lib/shared/components/ui/input';
	import type {
		IngredientMatch,
		IngredientSearchResponse
	} from '../../../../api/ingredients/search/+server';
	import { parseIngredientSearchInput, type ParsedSearchInput } from './parse-ingredient-input';

	const {
		language
	}: {
		language: LanguageKey;
	} = $props();

	let selectedIngredientSlug = $state('');

	let searchInput = $state('');

	let matches: IngredientMatch[] = $state([]);
	let parsedInput: ParsedSearchInput | null = $state(null);

	let debounceTimeout: NodeJS.Timeout; // Debounce the search input

	$effect(() => {
		searchInput; // Trigger the effect when the search input changes

		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(async () => {
			if (!searchInput) return;

			parsedInput = parseIngredientSearchInput(searchInput);
			if (!parsedInput.parsed.ingredientText) return;

			const response = await fetch('/api/ingredients/search', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'search-query': parsedInput.parsed.ingredientText,
					locale: language,
					limit: '5'
				}
			});
			const data = (await response.json()) as IngredientSearchResponse;

			matches = data.matches;
		}, 100);
	});
</script>

<div class="grid w-full space-y-4">
	<Input
		type="text"
		placeholder="3 tomatoes, chopped"
		class="w-full"
		bind:value={searchInput}
	/>

	<!-- <pre class="text-sm text-muted-foreground">{JSON.stringify(parsedInput?.parsed, null, 4)}</pre> -->

	{#if matches}
		<div class="grid w-full space-y-2 bg-background rounded-md">
			{#snippet ingredientGrid(match: IngredientMatch)}
				<div class="flex-1 text-center text-sm">
					<div class="bg-muted aspect-square rounded-md mb-2"></div>

					{#if parsedInput?.parsed.quantity}
						<span class="font-medium"
							>{parsedInput?.parsed.quantity.amount} {parsedInput?.parsed.quantity.unit}</span
						>
					{:else}
						<span class="font-bold">??</span>
					{/if}

					<span class="text-balance line-clamp-2 px-1">
						{parsedInput?.parsed.quantity && parsedInput?.parsed.quantity.amount != 1
							? match.plural || match.singular
							: match.singular || match.plural}
					</span>

					<span class="text-muted-foreground">{parsedInput?.parsed.description}</span>
				</div>
			{/snippet}

			<div class="grid gap-4" style="grid-template-columns: repeat(auto-fit, minmax(6rem, 1fr));">
				{#each matches as match (match.slug)}
						{@render ingredientGrid(match)}
				{/each}
			</div>

			<!-- {#each matches as match (match.slug)}
				<div class="flex items-center gap-2 text-sm">
					{#if parsedInput?.parsed.quantity}
						<span class="font-bold"
							>{parsedInput?.parsed.quantity.amount} {parsedInput?.parsed.quantity.unit}</span
						>
					{:else}
						<span class="font-bold">No quantity</span>
					{/if}

					<span>
						{parsedInput?.parsed.quantity && parsedInput?.parsed.quantity.amount != 1
							? match.plural || match.singular
							: match.singular || match.plural}
					</span>

					<span class="text-muted-foreground">{parsedInput?.parsed.description}</span>

					<span class="ml-auto text-muted-foreground">{parsedInput?.parsed.quantity?.unitKey}</span>
				</div>
			{/each} -->
		</div>
	{/if}
</div>
