<script lang="ts">
	import {
		hoveredMealIngredient,
		selectedMealIngredient
	} from '$lib/features/plans/state/hovered-meal-ingredient.svelte';
	import Button from '$lib/shared/components/ui/button/button.svelte';
	import { cn } from '$lib/utils';
	import { PanelLeft, PanelLeftClose } from 'lucide-svelte';
	import type { RecipeIngredientWithTranslations } from '../queries/get-recipe-detailed';
	import IngredientImage from './IngredientImage.svelte';

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
		selectable?: boolean;
		// State
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
		selectable = false,
		checked = $bindable(false),
		onCheckedChange = () => {},
		onclick = () => {},
		...others
	}: Props = $props();

	const translation = $derived(ingredient?.translations?.[0]);

	const name = $derived.by(() => {
		if (amount === null || amount === undefined || amount === 0 || (amount && amount > 1))
			return translation?.name_plural || translation?.name_singular;
		else return translation?.name_singular || translation?.name_plural;
	});

	const hovered = $derived(
		hoveredMealIngredient.value && hoveredMealIngredient.value.id === ingredient?.id
	);
	const selected = $derived(
		selectedMealIngredient.value && selectedMealIngredient.value.id === ingredient?.id
	);
</script>

<Button
	variant="outline"
	class={cn(
		'h-28 border-none hover:bg-white dark:hover:bg-muted relative group flex flex-col items-center gap-1 w-full bg-white dark:bg-muted p-2 text-sm rounded-lg shadow-2xs transition-colors duration-0 select-none',

		checked &&
			'bg-transparent hover:bg-transparent ring-2 ring-muted dark:bg-green-950 dark:ring-green-900',

		// !checked && hovered && !selected && selectable && 'ring-2 ring-primary/20 dark:ring-primary/30',
		!checked &&
			hovered &&
			!selected &&
			!selectable &&
			'ring-2 ring-primary/60 dark:ring-primary/60',

		selectable && selected && 'ring-2 ring-primary/80 dark:ring-primary/80',

		size === 'sm' && 'h-26 p-1 text-xs duration-75',
		size === 'lg' && 'h-32 p-3 text-md duration-75',
		className
	)}
	onclick={(e) => {
		// Toggle checked state
		if (checkable) {
			e.preventDefault();
			checked = !checked;
			onCheckedChange(checked);
		}

		onclick?.();
	}}
	oncontextmenu={(e) => {
		// Right click or long press to select the ingredient for detailed view in sidebar
		if (selectable) {
			e.preventDefault();
			selectedMealIngredient.value =
				selectedMealIngredient.value?.id === ingredient?.id ? null : ingredient;
		}
	}}
	{...others}
>
	{#if selectable && ingredient}
		<div
			class={cn(
				'absolute top-1 left-1 opacity-0 transition-opacity group-hover:opacity-100',
				selected && 'md:opacity-100'
			)}
		>
			<Button
				size="icon"
				variant="ghost"
				class={cn('size-10 rounded-full text-muted hover:bg-primary/10 hover:text-primary')}
				onclick={(e) => {
					e.preventDefault();
					e.stopPropagation();

					selectedMealIngredient.value =
						selectedMealIngredient.value?.id === ingredient?.id ? null : ingredient;
				}}
			>
				{#if selected}
					<PanelLeftClose class="size-5 text-primary" />
				{:else}
					<PanelLeft class="size-5" />
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
				checked && !hovered && 'line-through text-muted-foreground'
				// !amount && name && name.length < 20 && 'pb-1.5'
			)}
		>
			<span class="font-medium">{name || description || ''}</span>
		</span>

		{@render children?.()}
	</div>
</Button>
