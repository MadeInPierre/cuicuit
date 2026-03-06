<script lang="ts">
	import IngredientImage from './IngredientImage.svelte';
	import type { RecipeIngredientWithTranslations } from '../queries/get-recipe-detailed';
	import NumberFlow from '@number-flow/svelte';
	import { cn } from '$lib/utils';

	type Props = {
		ingredient: RecipeIngredientWithTranslations;
		amount?: number;
		unit?: string;
		description?: string;
		size?: 'sm' | 'md' | 'lg';
		[key: string]: any;
		children?: any;
	};

	let { ingredient, amount, unit, description, size = 'md', children, ...others }: Props = $props();

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
		'flex flex-col items-center gap-0 w-full bg-white p-2 text-sm rounded-lg shadow-2xs transition-all dark:bg-muted',
		size === 'sm' && 'p-1 text-xs',
		size === 'lg' && 'p-3 text-md'
	)}
	{...others}
>
	<IngredientImage id={ingredient.id} name={name || 'Unknown'} class="w-12 h-12" />

	<div class="grid space-y-0.5 text-center">
		<span
			class={cn(
				'line-clamp-2 h-[40px] text-balance',
				size === 'sm' && 'h-[30px]',
				size === 'lg' && 'h-[50px]'
			)}
		>
			<span class="font-medium">
				{name || 'Unknown'}
			</span>
			{description || ''}
		</span>

		<span class={cn('line-clamp-1 text-xs text-muted-foreground', size === 'lg' && 'text-sm')}>
			{amount}
			{unit == 'whole' ? '' : unit}
		</span>

		{@render children?.()}
	</div>
</div>
