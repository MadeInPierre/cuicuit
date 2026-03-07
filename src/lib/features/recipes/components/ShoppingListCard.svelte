<script lang="ts">
	import IngredientImage from './IngredientImage.svelte';
	import type { RecipeIngredientWithTranslations } from '../queries/get-recipe-detailed';
	import { cn } from '$lib/utils';
	import Button from '$lib/shared/components/ui/button/button.svelte';

	type Props = {
		ingredient: RecipeIngredientWithTranslations;
		amount?: number;
		unit?: string;
		description?: string;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
		[key: string]: any;
		children?: any;
		onclick?: () => void;
	};

	let {
		ingredient,
		amount,
		unit,
		description,
		size = 'md',
		class: className,
		children,
		onclick = () => {},
		...others
	}: Props = $props();

	const translation = $derived(
		ingredient.translations.find((t) => t.language?.lang === 'fr-FR') || ingredient.translations[0]
	);

	const name = $derived(
		amount && amount > 1
			? translation?.name_plural || translation?.name_singular
			: translation?.name_singular || translation?.name_plural
	);
</script>

<Button
	variant="outline"
	class={cn(
		'border-none hover:bg-white dark:hover:bg-muted',
		'flex flex-col items-center gap-1 w-full bg-white dark:bg-muted p-2 text-sm rounded-lg shadow-2xs transition-all',
		size === 'sm' && 'p-1 text-xs',
		size === 'lg' && 'p-3 text-md',
		className
	)}
	{...others}
	{onclick}
>
	<div class="flex-1 min-h-0 w-full">
		<IngredientImage
			id={ingredient.id}
			name={name || 'Unknown'}
			class="aspect-square h-full w-auto max-h-16 mx-auto"
		/>
	</div>

	<div class="grid space-y-0.5 text-center shrink-0">
		<span class={cn('line-clamp-2 text-balance')}>
			<span class="font-medium">
				{name || 'Unknown'}
			</span>
			{description || ''}
		</span>

		<span
			class={cn(
				'line-clamp-1 text-xs text-muted-foreground font-normal',
				size === 'lg' && 'text-sm'
			)}
		>
			{amount}
			{unit == 'whole' ? '' : unit}
		</span>

		{@render children?.()}
	</div>
</Button>
