<script lang="ts" module>
	export type SearchResults = {
		processedIngredient: IngredientProcessed | null;
		recipes: Recipe[] | undefined;
	};
</script>

<script lang="ts">
	import {
		processIngredientString,
		type IngredientProcessed
	} from '$lib/features/recipes/modules/parse-ingredients/process';
	import {
		getRecipesDetailed,
		type Recipe
	} from '$lib/features/recipes/queries/get-recipe-detailed';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import type { LanguageKey } from '$lib/features/user-settings/consts';
	import { supabase } from '$lib/shared/db/supabase-client.svelte';
	import { toast } from 'svelte-sonner';

	type Props = {
		inputRef: HTMLElement | null;
		inputValue: string;
		searchResults: SearchResults | null;
		loading?: boolean;
		display?: 'ingredients' | 'recipes' | 'both';
	};
	let {
		inputRef = $bindable(null),
		inputValue = $bindable(''),
		loading = $bindable(false),
		searchResults = $bindable(null),
		display = 'both'
	}: Props = $props();

	const space = getActiveSpaceState();

	let debounceTimeout: NodeJS.Timeout;

	$effect(() => {
		loading = inputValue.trim().length > 0;

		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(async () => {
			if (!space.activeSpace?.language_id) return;
			if (!supabase.client) return;

			// Reset processed input
			if (!inputValue.trim()) {
				searchResults = null;
				return;
			}

			let processedIngredient: IngredientProcessed | undefined = undefined;
			let recipes: Recipe[] | undefined = undefined;

			// Process the ingredient string into a structured format matched to the database
			processedIngredient = await processIngredientString(
				supabase.client,
				inputValue,
				space.activeSpace.language.lang as LanguageKey
			);

			// Also search for recipes
			if (display === 'recipes' || display === 'both') {
				const { data, error } = await getRecipesDetailed(
					space.activeSpace.language_id,
					inputValue
				).limit(3);
				if (error) {
					toast.error('Error fetching recipes');
				} else recipes = data ?? undefined;
			}

			// Update the main result object
			searchResults = { processedIngredient, recipes };

			// State updates
			loading = false;
		}, 200);
	});
</script>
