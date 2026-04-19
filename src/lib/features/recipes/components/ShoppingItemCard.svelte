<script lang="ts">
	import {
		hoveredMealIngredient,
		selectedMealIngredient
	} from '$lib/features/plans/state/hovered-meal-ingredient.svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import Button from '$lib/shared/components/ui/button/button.svelte';
	import { cn } from '$lib/utils';
	import { Circle, CircleCheckBig, PanelLeft, PanelLeftClose, Trash } from 'lucide-svelte';
	import type { RecipeIngredientWithTranslations } from '../queries/get-recipe-detailed';
	import IngredientImage from './IngredientImage.svelte';

	type Props = {
		// Ingredient
		ingredient?: RecipeIngredientWithTranslations | null;
		name?: string;
		description?: string | null;
		plural?: boolean;
		// Appearance
		layout?: 'grid' | 'list';
		size?: 'sm' | 'md' | 'lg';
		class?: string;
		children?: any;
		topRight?: any;
		// Interactions
		checkable?: boolean;
		selectable?: boolean;
		deletable?: boolean;
		checked?: boolean;
		onCheckedChange?: ((checked: boolean) => void) | undefined;
		onDelete?: (() => void) | undefined;
		onclick?: (e: MouseEvent | PointerEvent) => void;
	};

	let {
		// Ingredient
		ingredient = null,
		name = undefined,
		description,
		plural = false,
		// Appearance
		layout = 'grid',
		size = 'md',
		class: className,
		children,
		topRight,
		// Interactions
		checkable = true,
		selectable = false,
		deletable = false,
		checked = $bindable(false),
		onCheckedChange = undefined,
		onDelete = undefined,
		onclick = (e: MouseEvent | PointerEvent) => {}
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
	type={layout === 'list' ? 'button' : undefined}
	class={cn(
		// Base
		'relative group w-full select-none border-none rounded-lg shadow-2xs text-sm',
		'p-2 bg-white hover:bg-white dark:bg-muted dark:hover:bg-muted transition-[color,box-shadow]',

		// Layout base
		layout === 'grid' && 'h-28 flex flex-col items-center gap-1',
		layout === 'list' && 'flex items-center gap-2 text-left cursor-default',

		// Size
		size === 'sm' && layout === 'grid' && 'p-1.5 h-26',
		size === 'sm' && layout === 'list' && 'p-1.5',

		// Checked styles
		checked &&
			'ring-2 bg-transparent hover:bg-transparent ring-muted dark:bg-green-950 dark:hover:bg-green-950 dark:ring-green-900',

		// Interaction states
		!checked &&
			hovered &&
			!selected &&
			!selectable &&
			'ring-2 ring-primary/60 dark:ring-primary/60',
		selectable && selected && 'border-ring ring-ring/50 ring-[3px]'
	)}
	onclick={(e) => {
		// Toggle checked state
		if (onCheckedChange) {
			e.preventDefault();
			checked = !checked;
			onCheckedChange(checked);
		}

		onclick?.(e);
	}}
	oncontextmenu={(e) => {
		// Right click or long press to select the ingredient for detailed view in sidebar
		e.preventDefault();
		selectedMealIngredient.value =
		selectedMealIngredient.value?.id === ingredient?.id ? null : ingredient;
	}}
>
	{#if layout === 'grid'}
		{@render bonusButtons('absolute top-1 left-1 grid space-y-0')}

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
	{:else if layout === 'list'}
		<IngredientImage id={ingredient?.id || null} name={name || 'Unknown'} class="w-12 h-12" />

		<div class="grid space-y-0.5 ml-4">
			<span class={cn('text-md line-clamp-1', checked && 'line-through text-muted-foreground')}>
				{displayName || description || ''}
			</span>

			{@render children?.()}
		</div>

		{@render bonusButtons('flex items-center gap-2 ml-auto flex-row-reverse')}

		{#if deletable}
			<Button
				size="icon"
				variant="ghost"
				class="mr-1 size-10 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
				onclick={() => onDelete?.()}
			>
				<Trash class="size-4" />
			</Button>
		{:else if checkable}
			<div class="mr-3">
				{#if checked}
					<CircleCheckBig class="size-5 text-muted-foreground" />
				{:else}
					<Circle class="size-5 text-muted-foreground/60" />
				{/if}
			</div>
		{/if}
	{/if}
</button>

{#snippet bonusButtons(className: string = '')}
	<div
		class={cn(
			'opacity-0 transition-opacity duration-75 group-hover:opacity-100',
			selected && 'md:opacity-100',
			className
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

		{#if onDelete && !deletable}
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
{/snippet}

<style>
	.line-through {
		text-decoration: line-through green solid;
		text-decoration-color: color-mix(in srgb, var(--text-muted-foreground) 80%, transparent);

		text-decoration-thickness: 1.5px;
	}
</style>
