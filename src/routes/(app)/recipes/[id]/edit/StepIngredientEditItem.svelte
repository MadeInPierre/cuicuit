<script lang="ts">
	import IngredientImage from '$lib/features/recipes/components/IngredientImage.svelte';
	import UnitPicker from '$lib/features/recipes/components/UnitPicker.svelte';
	import type { StepIngredient } from '$lib/features/recipes/models/recipe-step';
	import { Button } from '$lib/shared/components/ui/button';
	import { Input } from '$lib/shared/components/ui/input';
	import * as Select from '$lib/shared/components/ui/select/index.js';
	import { toUnregionizedUnit } from '$lib/shared/utils/quantity';
	import { Highlighter, X } from '@lucide/svelte';
	import { stepIngredientRefKey, type StepIngredientOption } from './step-hints';

	type Props = {
		ingredient: StepIngredient;
		option?: StepIngredientOption;
		swapOptions: readonly StepIngredientOption[];
		disabled?: boolean;
		onRemove: () => void;
		onSwap: (option: StepIngredientOption) => void;
		onUpdate: (next: StepIngredient) => void;
	};
	let {
		ingredient,
		option,
		swapOptions,
		disabled = false,
		onRemove,
		onSwap,
		onUpdate
	}: Props = $props();

	const displayName = $derived(option?.name || ingredient.stepSubstring || 'Ingredient');
	const amount = $derived(ingredient.quantity?.amount ?? null);
	const unit = $derived(toUnregionizedUnit(ingredient.quantity?.unitKey));
	const selectedKey = $derived(option?.key ?? stepIngredientRefKey(ingredient));

	function setAmount(raw: string) {
		const value = raw.trim() === '' ? null : Number(raw);
		if (value === null || !Number.isFinite(value)) {
			onUpdate({ ...ingredient, quantity: null });
			return;
		}
		onUpdate({
			...ingredient,
			quantity: {
				amount: value,
				unitText: ingredient.quantity?.unitText ?? '',
				unitKey: toUnregionizedUnit(ingredient.quantity?.unitKey)
			}
		});
	}

	function setUnit(next: string) {
		onUpdate({
			...ingredient,
			quantity: {
				amount: ingredient.quantity?.amount ?? 1,
				unitText: ingredient.quantity?.unitText ?? '',
				unitKey: toUnregionizedUnit(next)
			}
		});
	}

	function setSubstring(raw: string) {
		onUpdate({ ...ingredient, stepSubstring: raw });
	}
</script>

<div class="flex min-w-0 items-center gap-2">
	<IngredientImage
		id={ingredient?.ingredientId || null}
		name={option?.name || ingredient?.stepSubstring || 'Ingredient'}
		class="size-8 min-w-8 text-lg"
	/>

	<Select.Root
		type="single"
		value={selectedKey}
		onValueChange={(value) => {
			const next = swapOptions.find((candidate) => candidate.key === value);
			if (next) onSwap(next);
		}}
	>
		<Select.Trigger
			class="h-8 w-32 max-w-32 shrink-0"
			aria-label={`Swap ingredient for ${displayName}`}
		>
			{option?.name || ingredient.stepSubstring || 'Ingredient'}
		</Select.Trigger>
		<Select.Content>
			{#each swapOptions as candidate (candidate.key)}
				<Select.Item value={candidate.key} label={candidate.name}>{candidate.name}</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>

	<div class="flex items-center">
		<Input
			type="number"
			inputmode="decimal"
			step="0.01"
			min="0"
			class="h-8 w-20 rounded-r-none border-r-0 text-right text-sm"
			placeholder="—"
			value={amount ?? ''}
			{disabled}
			aria-label={`Amount for ${displayName}`}
			oninput={(event) => setAmount(event.currentTarget.value)}
		/>
		<UnitPicker
			{unit}
			{disabled}
			class="h-8 w-20 rounded-l-none border-l-0 border-input"
			onchange={setUnit}
		/>
	</div>

	<div class="relative w-full flex items-center gap-1.5">
		<Highlighter
			class="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 shrink-0 text-muted-foreground"
		/>
		<Input
			value={ingredient.stepSubstring}
			placeholder="Text highlighted in the step"
			class="h-8 text-xs"
			{disabled}
			aria-label={`Highlighted text for ${displayName}`}
			oninput={(event) => setSubstring(event.currentTarget.value)}
		/>
	</div>

	<Button
		variant="ghost"
		size="icon-sm"
		class="ml-auto text-muted-foreground hover:text-destructive"
		{disabled}
		onclick={onRemove}
		aria-label={`Remove ${displayName} from step`}
	>
		<X class="size-4" />
	</Button>
</div>
