<script lang="ts">
	import {
		hoveredMealIngredient,
		selectedMealIngredient
	} from '$lib/features/plans/state/hovered-meal-ingredient.svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import Button from '$lib/shared/components/ui/button/button.svelte';
	import { cn } from '$lib/utils';
	import { PanelLeft, PanelLeftClose, Trash } from 'lucide-svelte';
	import type { RecipeIngredientWithTranslations } from '../queries/get-recipe-detailed';
	import IngredientImage from './IngredientImage.svelte';

	type Props = {
		// Ingredient
		ingredient?: RecipeIngredientWithTranslations | null;
		name?: string;
		description?: string | null;
		plural?: boolean;
		// Appearance
		size?: 'sm' | 'md' | 'lg';
		class?: string;
		children?: any;
		topRight?: any;
		// Interactions
		selectable?: boolean;
		// State
		checked?: boolean;
		onCheckedChange?: ((checked: boolean) => void) | undefined;
		onDelete?: (() => void) | undefined;
		onclick?: () => void;
		// Others
		[key: string]: any;
	};

	let {
		ingredient = null,
		name = undefined,
		description,
		plural = false,
		size = 'md',
		class: className,
		children,
		topRight,
		selectable = false,
		checked = $bindable(false),
		onCheckedChange = undefined,
		onDelete = undefined,
		onclick = () => {},
		...others
	}: Props = $props();

	const space = getActiveSpaceState();

	const translation = $derived(
		ingredient?.translations?.find((t) => t.language.lang === space.language?.lang) || null
	);

	const displayName = $derived.by(() => {
		if (!ingredient) return name || description || '?';
		if (plural) return translation?.name_plural || translation?.name_singular;
		else return translation?.name_singular || translation?.name_plural;
	});

	const hovered = $derived(
		hoveredMealIngredient.value && hoveredMealIngredient.value.id === ingredient?.id
	);
	const selected = $derived(
		selectedMealIngredient.value && selectedMealIngredient.value.id === ingredient?.id
	);

	const isTouchPointerEvent = (event: MouseEvent | PointerEvent) => {
		return 'pointerType' in event && event.pointerType === 'touch';
	};
</script>

<button
	class={cn(
		'h-28 border-none hover:bg-white dark:hover:bg-muted relative group flex flex-col items-center gap-1 w-full bg-white dark:bg-muted p-2 text-sm rounded-lg shadow-2xs transition-[color,box-shadow] select-none',

		checked &&
			'bg-transparent hover:bg-transparent ring-2 ring-muted dark:bg-green-950 dark:ring-green-900 hover:ring-muted-foreground/30',

		!checked &&
			hovered &&
			!selected &&
			!selectable &&
			'ring-2 ring-primary/60 dark:ring-primary/60',

		selectable && selected && 'border-ring ring-ring/50 ring-[3px]',

		size === 'sm' && 'p-1.5 h-26'
	)}
	onclick={(e) => {
		// Toggle checked state
		if (onCheckedChange) {
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
	<div
		class={cn(
			'absolute top-1 left-1 opacity-0 transition-opacity duration-75 group-hover:opacity-100 grid space-y-0',
			selected && 'md:opacity-100'
		)}
	>
		{#if selectable && ingredient}
			<Button
				size="icon"
				variant="ghost"
				class={cn('size-8 rounded-full text-muted hover:bg-primary/10 hover:text-primary')}
				onclick={(e) => {
					if (isTouchPointerEvent(e)) return;
					e.preventDefault();
					e.stopPropagation();

					selectedMealIngredient.value =
						selectedMealIngredient.value?.id === ingredient?.id ? null : ingredient;
				}}
			>
				{#if selected}
					<PanelLeftClose class="size-4 text-primary" />
				{:else}
					<PanelLeft class="size-4" />
				{/if}
			</Button>
		{/if}

		{#if onDelete}
			<Button
				size="icon"
				variant="ghost"
				class="size-8 rounded-full text-muted hover:bg-primary/10 hover:text-primary"
				onclick={async (e) => {
					if (isTouchPointerEvent(e)) return;
					e.preventDefault();
					e.stopPropagation();

					onDelete();
				}}
			>
				<Trash class="size-4" />
			</Button>
		{/if}
	</div>

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
			name={displayName || description || '?'}
			class={cn(
				'aspect-square h-full w-auto max-h-16 mx-auto transition-opacity',
				checked && 'opacity-40'
			)}
		/>
	</div>

	<div class="grid space-y-0.5 text-center shrink-0">
		{#if description}
			<span
				class={cn(
					'line-clamp-1 text-xs text-muted-foreground font-normal',
					size === 'lg' && 'text-sm'
				)}
			>
				{description}
			</span>
		{/if}

		<span
			class={cn(
				'font-medium line-clamp-2 text-balance pb-0.5',
				checked && 'line-through text-muted-foreground',
				size === 'sm' && 'text-xs'
			)}
		>
			{displayName || description || ''}
		</span>

		{@render children?.()}
	</div>
</button>
