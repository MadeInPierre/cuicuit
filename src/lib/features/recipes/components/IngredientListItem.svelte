<script lang="ts">
	import IngredientImage from './IngredientImage.svelte';
	import type { IngredientWithTranslations } from '../queries/get-recipe-detailed';
	import NumberFlow from '@number-flow/svelte';

	type Props = {
		ingredient: IngredientWithTranslations;
		amount?: number;
		unit?: string;
	};

	const { ingredient, amount, unit }: Props = $props();

	const translation = ingredient.translations.find((t) => t.language.lang === 'fr-FR') || ingredient.translations[0];
</script>

<div class="flex items-center gap-2">
	<IngredientImage
		id={ingredient.id}
		name={translation.name_singular || 'Unknown'}
		class="w-12 h-12"
	/>
	<div class="flex-1 ml-4">
		<span class="text-sm font-medium">{translation.name_singular || 'Unknown'}</span>
		<span class="text-xs text-balance line-clamp-2">
			<NumberFlow value={amount} />
			{unit == 'whole' ? '' : unit}
		</span>
	</div>
</div>
