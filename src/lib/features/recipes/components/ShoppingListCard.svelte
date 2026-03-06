<script lang="ts">
	import IngredientImage from './IngredientImage.svelte';
	import type { RecipeIngredientWithTranslations } from '../queries/get-recipe-detailed';
	import NumberFlow from '@number-flow/svelte';
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

<div
	class={cn(
		'flex flex-col items-center gap-0 w-full bg-white p-2 rounded-lg shadow-2xs transition-all dark:bg-muted'
	)}
	{...others}
>
	<IngredientImage id={ingredient.id} name={name || 'Unknown'} class="w-12 h-12" />

	<div class="grid space-y-0.5 text-center text-sm">
		<span class="line-clamp-2 min-h-[40px] font-medium">
			{name || 'Unknown'}
		</span>

		<span class="line-clamp-1 text-xs text-muted-foreground">
			{amount}
			{unit == 'whole' ? '' : unit}
		</span>

		{@render children?.()}
	</div>
</div>
