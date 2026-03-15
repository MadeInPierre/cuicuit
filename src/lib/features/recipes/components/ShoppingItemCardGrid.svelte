<script lang="ts">
	import IngredientImage from './IngredientImage.svelte';
	import type { RecipeIngredientWithTranslations } from '../queries/get-recipe-detailed';
	import { cn } from '$lib/utils';
	import Button from '$lib/shared/components/ui/button/button.svelte';
	import { CircleCheckBig, Circle } from 'lucide-svelte';
	import {
		hoveredMealIngredientId,
		selectedMealIngredientId
	} from '$lib/features/plans/state/hovered-meal-ingredient.svelte';

	type Props = {
		// Ingredient
		ingredient?: RecipeIngredientWithTranslations | null;
		description?: string | null;
		// Quantity
		amount?: number | null;
		unit?: string | null;
		// Appearance
		size?: 'sm' | 'md' | 'lg';
		class?: string;
		children?: any;
		topRight?: any;
		// Interactions
		checkable?: boolean;
		checked?: boolean;
		onCheckedChange?: (checked: boolean) => void;
		onclick?: () => void;
		// Others
		[key: string]: any;
	};

	let {
		ingredient = null,
		amount,
		unit,
		description,
		size = 'md',
		class: className,
		children,
		topRight,
		checkable = false,
		checked = $bindable(false),
		onCheckedChange = () => {},
		onclick = () => {},
		...others
	}: Props = $props();

	const translation = $derived(
		ingredient?.translations.find((t) => t.language?.lang === 'fr-FR') ||
			ingredient?.translations[0]
	);

	const name = $derived.by(() => {
		if (amount === null || amount === undefined || amount === 0 || (amount && amount > 1))
			return translation?.name_plural || translation?.name_singular;
		else return translation?.name_singular || translation?.name_plural;
	});
</script>

<Button
	variant="outline"
	class={cn(
		'h-28 border-none hover:bg-white dark:hover:bg-muted relative group flex flex-col items-center gap-1 w-full bg-white dark:bg-muted p-2 text-sm rounded-lg shadow-2xs transition-colors duration-0',
		checked &&
			'bg-transparent hover:bg-transparent ring-2 ring-muted dark:bg-green-950 dark:ring-green-900',
		selectedMealIngredientId.value === ingredient?.id &&
			'ring-2 ring-primary/80 dark:ring-primary/80',
		size === 'sm' && 'h-26 p-1 text-xs duration-75',
		size === 'lg' && 'h-32 p-3 text-md duration-75',
		className
	)}
	onclick={(e) => {
		// On touch devices, toggle checked state on click instead of hover
		if (checkable && window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
			e.preventDefault();
			checked = !checked;
			onCheckedChange(checked);
		}
		onclick?.();
	}}
	{...others}
>
	{#if checkable}
		<div
			class={cn(
				'absolute top-0 left-1 opacity-0 group-hover:opacity-100',
				checked && 'md:opacity-100'
			)}
		>
			<Button
				size="icon"
				variant="ghost"
				class={cn(
					'ml-auto mt-1 size-10 rounded-full text-muted-foreground',
					selectedMealIngredientId.value === ingredient?.id && 'text-primary/80 hover:bg-primary/15'
				)}
				onclick={() => {
					checked = !checked;
					onCheckedChange(checked);
				}}
			>
				{#if checked}
					<CircleCheckBig class="size-5" />
				{:else}
					<Circle class="size-5" />
				{/if}
			</Button>
		</div>
	{/if}

	{#if topRight}
		<div
			class="absolute top-2 right-2 flex flex-col items-end space-y-1 text-xs font-normal text-muted-foreground/60"
		>
			{@render topRight?.()}
		</div>
	{/if}

	<div class="flex-1 min-h-0 w-full">
		<IngredientImage
			id={ingredient?.id || null}
			name={name || description || '?'}
			class={cn(
				'aspect-square h-full w-auto max-h-16 mx-auto transition-opacity',
				checked && 'opacity-40 group-hover:opacity-100'
			)}
		/>
	</div>

	<div class="grid space-y-0.5 text-center shrink-0">
		{#if amount}
			<span
				class={cn(
					'line-clamp-1 text-xs text-muted-foreground font-normal',
					size === 'lg' && 'text-sm'
				)}
			>
				{amount}
				{unit === 'whole' ? '' : unit}
			</span>
		{/if}

		<span
			class={cn(
				'line-clamp-2 text-balance pb-0.5',
				checked && 'line-through text-muted-foreground'
				// !amount && name && name.length < 20 && 'pb-1.5'
			)}
		>
			<span class="font-medium">{name || description || ''}</span>
		</span>

		{@render children?.()}
	</div>
</Button>
