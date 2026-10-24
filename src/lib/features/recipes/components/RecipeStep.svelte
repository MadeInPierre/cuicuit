<script lang="ts">
	import { resolveIngredientName } from '$lib/features/ingredients/utils/ingredient-display';
	import type { LanguageCode } from '$lib/shared/language.js';
	import { formatQuantity } from '$lib/shared/utils/format-quantity';
	import { cn } from '$lib/utils';
	import { Check } from '@lucide/svelte';
	import type { RecipeStep, StepIngredient } from '../models/recipe-step';
	import type { RecipeIngredientDetailed } from '../queries/get-recipe-detailed';
	import {
		highlightStepText,
		type HighlightKind,
		type HighlightSegment,
		type HighlightTerm
	} from '../utils/highlight-step';
	import IngredientImage from './IngredientImage.svelte';
	import StepTimer from './StepTimer.svelte';

	type Props = {
		step: RecipeStep;
		index: number;
		ingredients: RecipeIngredientDetailed[];
		lang?: LanguageCode | null;
		displayServings: number;
		recipeServings: number;
	};

	const {
		step,
		index,
		ingredients,
		lang = null,
		displayServings,
		recipeServings
	}: Props = $props();

	let isDone = $state(false);

	type ResolvedStepIngredient = {
		name: string;
		quantityText: string | null;
		imageId: string | null;
		highlightTerms: string[];
	};

	type HoveredTarget =
		| { type: 'segment'; kind: HighlightKind; text: string }
		| { type: 'ingredient'; index: number };

	let hoveredTarget = $state<HoveredTarget | null>(null);

	function ingredientTerms(ref: StepIngredient): HighlightTerm[] {
		return ref.stepSubstring ? [{ text: ref.stepSubstring, kind: 'ingredient' }] : [];
	}

	function setHoveredSegment(segment: HighlightSegment) {
		hoveredTarget = segment.kind
			? { type: 'segment', kind: segment.kind, text: segment.text }
			: null;
	}

	function findIngredient(ref: StepIngredient): RecipeIngredientDetailed | undefined {
		if (!ref.ingredientId) return undefined;
		return ingredients.find((ing) => ing.ingredient_id === ref.ingredientId);
	}

	const resolved = $derived<ResolvedStepIngredient[]>(
		step.ingredients.map((ref) => {
			const matched = findIngredient(ref);
			const ratio = recipeServings > 0 ? displayServings / recipeServings : 1;
			const amount = ref.quantity ? ref.quantity.amount * ratio : null;

			return {
				name: matched
					? resolveIngredientName(matched.ingredient?.translations, {
							lang,
							plural: (amount ?? 0) > 1,
							customName: matched.custom_name
						})
					: ref.stepSubstring,
				quantityText: ref.quantity ? formatQuantity(amount, ref.quantity.unitKey, true) : null,
				imageId: matched?.ingredient?.id ?? null,
				highlightTerms: ingredientTerms(ref).map(({ text }) => text)
			};
		})
	);

	const highlightTerms = $derived<HighlightTerm[]>([
		...step.ingredients.flatMap(ingredientTerms),
		...temperatureTerms(step.temperature_amount, step.temperature_unit)
	]);

	function temperatureTerms(amount: number | null, unit: 'C' | 'F' | null): HighlightTerm[] {
		if (!amount || !unit) return [];
		return [
			`${amount}°${unit}`,
			`${amount} °${unit}`,
			`${amount}°${unit.toLowerCase()}`,
			`${amount} ${unit}`
		].map((text) => ({ text, kind: 'temperature' }));
	}

	const segments = $derived(highlightStepText(step.text, highlightTerms));

	function isSegmentHighlighted(segment: HighlightSegment): boolean {
		if (!segment.kind || !hoveredTarget) return false;
		if (hoveredTarget.type === 'segment') {
			return hoveredTarget.kind === segment.kind && hoveredTarget.text === segment.text;
		}
		return (
			segment.kind === 'ingredient' &&
			resolved[hoveredTarget.index]?.highlightTerms.some(
				(term) => term.toLowerCase() === segment.text.toLowerCase()
			)
		);
	}

	function isIngredientHighlighted(item: ResolvedStepIngredient, itemIndex: number): boolean {
		if (hoveredTarget?.type === 'ingredient') return hoveredTarget.index === itemIndex;
		if (hoveredTarget?.type !== 'segment' || hoveredTarget.kind !== 'ingredient') return false;
		const hoveredText = hoveredTarget.text;
		return item.highlightTerms.some((term) => term.toLowerCase() === hoveredText.toLowerCase());
	}
</script>

<div class="grid gap-3 mb-8">
	<div class="flex items-start">
		<button
			type="button"
			aria-label={`Mark step ${index + 1} ${isDone ? 'not done' : 'done'}`}
			aria-pressed={isDone}
			class={cn(
				'text-md font-semibold text-primary bg-muted rounded-lg size-8 min-w-8 flex justify-center items-center transition-all duration-200 ease-out active:scale-95',
				isDone && 'bg-green-600 text-white'
			)}
			onclick={() => (isDone = !isDone)}
		>
			{#if isDone}
				<Check class="size-5" />
			{:else}
				{index + 1}
			{/if}
		</button>

		<p class={cn('ml-4 pt-0.5 text-md transition-opacity duration-200', isDone && 'opacity-80')}>
			{#each segments as segment, segmentIndex (segmentIndex)}
				{#if segment.kind === 'ingredient'}
					<span
						role="mark"
						class={cn(
							'rounded bg-accent/80 px-0.5 transition-colors duration-75',
							isSegmentHighlighted(segment) && 'text-primary bg-primary/15'
						)}
						onpointerenter={() => setHoveredSegment(segment)}
						onpointerleave={() => (hoveredTarget = null)}
					>
						{segment.text}
					</span>
				{:else if segment.kind === 'temperature'}
					<span
						role="mark"
						class="rounded bg-yellow-400/25 px-0.5 font-medium text-yellow-700 transition-colors duration-75 dark:text-yellow-300"
						onpointerenter={() => setHoveredSegment(segment)}
						onpointerleave={() => (hoveredTarget = null)}
					>
						{segment.text}
					</span>
				{:else}
					{segment.text}
				{/if}
			{/each}
		</p>
	</div>

	{#if resolved.length > 0}
		<div class="ml-12 flex flex-wrap gap-2">
			{#each resolved as item, itemIndex (itemIndex)}
				<div
					role="group"
					class={cn(
						'flex w-16 flex-col items-center gap-1 rounded-lg border-3 p-0.5 shadow-2xs transition-colors duration-75 bg-card',
						isIngredientHighlighted(item, itemIndex) ? 'border-primary/60' : 'border-transparent'
					)}
					onpointerenter={() => (hoveredTarget = { type: 'ingredient', index: itemIndex })}
					onpointerleave={() => (hoveredTarget = null)}
				>
					<IngredientImage id={item.imageId} name={item.name} class="size-11 rounded-md text-lg" />

					<span class="w-full truncate text-center text-xs text-muted-foreground">
						{item.quantityText ?? 'to taste'}
					</span>
				</div>
			{/each}
		</div>
	{/if}

	{#if step.timer_minutes || (step.temperature_amount && step.temperature_unit)}
		<StepTimer
			minutes={step.timer_minutes}
			temperatureAmount={step.temperature_amount}
			temperatureUnit={step.temperature_unit}
			class={cn(
				'ml-12 border-3 transition-colors duration-75',
				hoveredTarget?.type === 'segment' && hoveredTarget.kind === 'temperature'
					? 'border-primary/60'
					: 'border-transparent'
			)}
		/>
	{/if}
</div>
