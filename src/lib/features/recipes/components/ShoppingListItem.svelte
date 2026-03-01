<script lang="ts">
	import IngredientImage from './IngredientImage.svelte';
	import type { IngredientWithTranslations } from '../queries/get-recipe-detailed';
	import NumberFlow from '@number-flow/svelte';
	import { ChefHat, Circle, CircleCheck, CircleCheckBig, House } from 'lucide-svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { cn } from '$lib/utils';

	type Props = {
		ingredient: IngredientWithTranslations;
		amount?: number;
		unit?: string;
		[key: string]: any;
		children?: any;
		checked?: boolean;
	};

	let {
		ingredient,
		amount,
		unit,
		children,
		checked = $bindable(false),
		...others
	}: Props = $props();

	const translation = $derived(
		ingredient.translations.find((t) => t.language.lang === 'fr-FR') || ingredient.translations[0]
	);

	const name = $derived(
		amount && amount > 1
			? translation.name_plural || translation.name_singular
			: translation?.name_singular || translation?.name_plural
	);
</script>

<div
	class={cn(
		'flex items-start gap-2 w-full bg-white p-2 rounded-lg shadow-2xs transition-all',
		checked
			? 'bg-transparent shadow-none'
			: 'dark:bg-muted hover:ring-2 hover:ring-muted-foreground/30'
	)}
	{...others}
>
	<IngredientImage id={ingredient.id} name={name || 'Unknown'} class="w-12 h-12" />

	<div class="grid space-y-0.5 ml-4">
		<span class={cn('text-md line-clamp-1', checked && 'line-through text-green-600')}>
			<span class="font-medium mr-1">
				{#if checked}
					<!-- Needed due to strikethrough issues with NumberFlow -->
					{amount}
				{:else}
					<NumberFlow value={amount} />
				{/if}

				{unit == 'whole' ? '' : unit}
			</span>

			<span class="">
				{name || 'Unknown'}
			</span>
		</span>

		{@render children?.()}
	</div>

	<Button
		size="icon"
		variant="ghost"
		class={cn('ml-auto mt-1 size-10 rounded-full', checked && 'hover:bg-green-100 dark:hover:bg-green-900/20')}
		onclick={() => (checked = !checked)}
	>
		{#if checked}
			<CircleCheckBig class="size-10 text-green-600" />
		{:else}
			<Circle class="size-10 text-muted-foreground/60" />
		{/if}
	</Button>
</div>

<style>
	.line-through {
		text-decoration: line-through green solid;
		text-decoration-color: color-mix(in srgb, var(--text-green-600) 80%, transparent);

		text-decoration-thickness: 1.5px;
	}
</style>
