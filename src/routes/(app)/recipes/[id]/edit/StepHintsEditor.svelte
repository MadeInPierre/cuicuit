<script lang="ts">
	import type { RecipeStepHints, StepIngredient } from '$lib/features/recipes/models/recipe-step';
	import { Button } from '$lib/shared/components/ui/button';
	import { Input } from '$lib/shared/components/ui/input';
	import * as Popover from '$lib/shared/components/ui/popover';
	import { toUnregionizedUnit } from '$lib/shared/utils/quantity';
	import { cn } from '$lib/utils';
	import { Plus, Thermometer, Timer, X } from '@lucide/svelte';
	import StepIngredientEditItem from './StepIngredientEditItem.svelte';
	import StepIngredientPicker from './StepIngredientPicker.svelte';
	import {
		findStepIngredientOption,
		stepIngredientRefKey,
		type StepIngredientOption
	} from './step-hints';

	type Props = {
		hints: RecipeStepHints;
		options: readonly StepIngredientOption[];
		disabled?: boolean;
	};

	let { hints = $bindable(), options, disabled = false }: Props = $props();

	let addOpen = $state(false);

	const linkedKeys = $derived(new Set(hints.ingredients.map(stepIngredientRefKey)));
	const addableOptions = $derived(options.filter((option) => !linkedKeys.has(option.key)));

	function addIngredient(option: StepIngredientOption) {
		hints = {
			...hints,
			ingredients: [
				...hints.ingredients,
				{
					ingredientId: option.ingredientId,
					stepSubstring: option.name,
					quantity: {
						amount: option.amount || 1,
						unitText: '',
						unitKey: toUnregionizedUnit(option.unit)
					}
				}
			]
		};
		addOpen = false;
	}

	function removeIngredient(index: number) {
		hints = { ...hints, ingredients: hints.ingredients.filter((_, itemIndex) => itemIndex !== index) };
	}

	function setTimer(raw: string) {
		const value = raw.trim() === '' ? null : Number(raw);
		const timer = value !== null && Number.isFinite(value) && value > 0 ? Math.round(value) : null;
		hints = { ...hints, timer_minutes: timer };
	}

	function setTemperature(raw: string) {
		const value = raw.trim() === '' ? null : Number(raw);
		if (value === null || !Number.isFinite(value) || value <= 0) {
			hints = { ...hints, temperature_amount: null, temperature_unit: null };
			return;
		}
		hints = {
			...hints,
			temperature_amount: value,
			temperature_unit: hints.temperature_unit ?? 'C'
		};
	}
</script>

<div class="grid gap-2 p-3 px-6">
	<div class="flex items-center gap-2">
		<span class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
			Ingredients
		</span>

		<Popover.Root bind:open={addOpen}>
			<Popover.Trigger>
				<Button
					type="button"
					variant="secondary"
					size="icon-sm"
					class="size-6"
					disabled={disabled || addableOptions.length === 0}
				>
					<Plus class="size-3.5" />
				</Button>
			</Popover.Trigger>
			<Popover.Content class="w-64 p-1" align="end">
				<StepIngredientPicker
					options={addableOptions}
					onSelect={addIngredient}
					emptyMessage="All recipe ingredients are already linked."
				/>
			</Popover.Content>
		</Popover.Root>
	</div>

	{#if hints.ingredients.length > 0}
		<div class="grid space-y-2">
			{#each hints.ingredients as ingredient, index (index)}
				{@const option = findStepIngredientOption(ingredient, options)}
				{@const currentKey = stepIngredientRefKey(ingredient)}
				{@const swapOptions = options.filter(
					(candidate) => candidate.key === currentKey || !linkedKeys.has(candidate.key)
				)}
				<StepIngredientEditItem
					{ingredient}
					{option}
					{swapOptions}
					{disabled}
					onRemove={() => removeIngredient(index)}
					onSwap={(next) => {
						hints = {
							...hints,
							ingredients: hints.ingredients.map((item, i) =>
								i === index
									? { ...item, ingredientId: next.ingredientId }
									: item
							)
						};
					}}
					onUpdate={(next) => {
						hints = {
							...hints,
							ingredients: hints.ingredients.map((item, i) => (i === index ? next : item))
						};
					}}
				/>
			{/each}
		</div>
	{:else}
		<p class="pl-4 py-2 italic text-xs text-muted-foreground/60">No ingredients linked to this step yet.</p>
	{/if}

	<span class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
		Timer & Oven
	</span>
	<div class="flex flex-wrap items-center gap-2">
		<div
			class="flex h-8 items-center gap-1.5 rounded-md border bg-background px-2"
			class:opacity-60={disabled}
		>
			<Timer class="size-3.5 shrink-0 text-muted-foreground" />
			<Input
				type="number"
				min="1"
				step="1"
				class="h-6 w-14 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0"
				placeholder="0"
				value={hints.timer_minutes ?? ''}
				{disabled}
				aria-label="Step timer in minutes"
				oninput={(event) => setTimer(event.currentTarget.value)}
			/>
			<span class="text-xs text-muted-foreground">min</span>
			{#if hints.timer_minutes != null}
				<Button
					variant="ghost"
					size="icon-sm"
					class="size-6 text-muted-foreground"
					{disabled}
					onclick={() => (hints = { ...hints, timer_minutes: null })}
					aria-label="Remove timer"
				>
					<X class="size-3.5" />
				</Button>
			{/if}
		</div>

		<div
			class="flex h-8 items-center gap-1.5 rounded-md border bg-background px-2"
			class:opacity-60={disabled}
		>
			<Thermometer class="size-3.5 shrink-0 text-muted-foreground" />
			<Input
				type="number"
				min="1"
				step="1"
				class="h-6 w-14 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0"
				placeholder="0"
				value={hints.temperature_amount ?? ''}
				{disabled}
				aria-label="Step temperature"
				oninput={(event) => setTemperature(event.currentTarget.value)}
			/>
			<div class="flex">
				{#each ['C', 'F'] as unit (unit)}
					<button
						type="button"
						class={cn(
							'size-6 text-xs transition-colors rounded-sm',
							hints.temperature_unit === unit
								? 'bg-primary text-primary-foreground'
								: 'hover:bg-accent'
						)}
						disabled={disabled || hints.temperature_amount == null}
						onclick={() => (hints = { ...hints, temperature_unit: unit as 'C' | 'F' })}
					>
						{unit}°
					</button>
				{/each}
			</div>
			{#if hints.temperature_amount != null}
				<Button
					variant="ghost"
					size="icon-sm"
					class="size-6 text-muted-foreground"
					{disabled}
					onclick={() => {
						hints = { ...hints, temperature_amount: null, temperature_unit: null };
					}}
					aria-label="Remove temperature"
				>
					<X class="size-3.5" />
				</Button>
			{/if}
		</div>
	</div>
</div>
