<script lang="ts">
	import IngredientImage from './IngredientImage.svelte';
	import type { IngredientWithTranslations } from '../queries/get-recipe-detailed';
	import NumberFlow from '@number-flow/svelte';
	import { ChefHat, House } from 'lucide-svelte';

	type Props = {
		ingredient: IngredientWithTranslations;
		amount?: number;
		unit?: string;
		[key: string]: any;
		children?: any;
	};

	const { ingredient, amount, unit, children, ...others }: Props = $props();

	const translation = $derived(
		ingredient.translations.find((t) => t.language.lang === 'fr-FR') || ingredient.translations[0]
	);

	const name = $derived(
		amount && amount > 1
			? translation.name_plural || translation.name_singular
			: translation?.name_singular || translation?.name_plural
	);
</script>

<div class="flex items-start gap-2" {...others}>
	<IngredientImage id={ingredient.id} name={name || 'Unknown'} class="w-12 h-12" />
	<div class="grid space-y-0.5 ml-4">
		<span class="text-md">
			<span class="font-medium mr-1">
				<NumberFlow value={amount} />
				{unit == 'whole' ? '' : unit}
			</span>

			<span class="">
				{name || 'Unknown'}
			</span>
		</span>

		{@render children?.()}
	</div>
</div>
