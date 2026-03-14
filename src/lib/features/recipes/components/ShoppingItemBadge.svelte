<script lang="ts">
	import IngredientImage from './IngredientImage.svelte';
	import type { RecipeIngredientWithTranslations } from '../queries/get-recipe-detailed';
	import NumberFlow from '@number-flow/svelte';
	import { Circle, CircleCheckBig, Plus } from 'lucide-svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { cn } from '$lib/utils';

	type Props = {
		ingredient: RecipeIngredientWithTranslations;
		amount?: number;
		unit?: string;
		[key: string]: any;
		children?: any;
	};

	let { ingredient, amount, unit, children, ...others }: Props = $props();

	const translation = $derived(
		ingredient.translations.find((t) => t.language?.lang === 'fr-FR') || ingredient.translations[0]
	);

	const name = $derived(
		amount && amount > 1
			? translation.name_plural || translation.name_singular
			: translation?.name_singular || translation?.name_plural
	);
</script>

<button class="flex items-center gap-2 bg-white pl-2 pr-4 py-0 rounded-full shadow-2xs">
	<IngredientImage id={ingredient.id} name={name || 'Unknown'} class="w-7 h-7 rounded-full" />

	<div class="text-sm">
		{name || 'Unknown'}
	</div>
</button>
