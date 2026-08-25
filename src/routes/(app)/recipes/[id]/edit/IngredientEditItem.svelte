<script lang="ts">
	import IngredientImage from '$lib/features/recipes/components/IngredientImage.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import * as Form from '$lib/shared/components/ui/form';
	import { Input } from '$lib/shared/components/ui/input';
	import * as Select from '$lib/shared/components/ui/select/index.js';
	import {
		unitLabels,
		unitToRegionized,
		unitToUnregionized,
		type UnitRegionized,
		type UnitUnregionized
	} from '$lib/shared/utils/quantity';
	import { ArrowUpDown, X } from 'lucide-svelte';

	type Props = {
		form: any; // TODO: specify form type
		id: string;
		name: string;
		amount?: number;
		unit?: string;
		isOptional?: boolean;
		disabled?: boolean;
		disableDelete?: boolean;
		onDelete?: () => void;
	};
	let {
		form,
		id,
		name = $bindable(),
		amount = $bindable(),
		unit = $bindable(),
		isOptional = $bindable(),
		disabled,
		disableDelete,
		onDelete
	}: Props = $props();
</script>

<div class="grid gap-3">
	<div class="grid gap-2">
		<div class="w-full flex gap-3 items-center">
			<!-- <GripVertical class="size-6 text-muted-foreground cursor-grab" /> -->
			<!-- <IngredientSelectDropdown /> -->

			<IngredientImage {id} {name} class="w-10 h-10 min-w-10" />

			<div class="flex">
				<Form.Field {form} name="ingredientAmounts" class="space-y-0">
					<Form.Control>
						{#snippet children({ props })}
							<Input
								{...props}
								{disabled}
								name="ingredientAmounts"
								type="number"
								step="0.01"
								class="w-20 rounded-r-none border-r-0"
								bind:value={amount}
							/>
						{/snippet}
					</Form.Control>
				</Form.Field>

				<Form.Field {form} name="ingredientUnits" class="space-y-0">
					<Form.Control>
						{#snippet children({ props })}
							<Select.Root type="single" bind:value={unit} {...props} {disabled}>
								<Select.Trigger class="gap-1 bg-muted/40 rounded-l-none w-26 h-9">
									{unit &&
									Object.keys(unitLabels).includes(unitToUnregionized(unit as UnitRegionized))
										? unitLabels[unitToUnregionized(unit as UnitRegionized)]
										: '?'}
								</Select.Trigger>
								<Select.Content>
									{#each Object.entries(unitLabels) as [key, label]}
										<!-- TODO make unit region a user setting -->
										<Select.Item value={unitToRegionized(key as UnitUnregionized, 'eu')} {label} />
									{/each}
								</Select.Content>
							</Select.Root>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors class="text-red-600" />
				</Form.Field>
			</div>

			<!-- <Form.Field {form} name="ingredientNames" class="space-y-0 w-full">
				<Form.Control>
					{#snippet children({ props })}
						<Input
							{...props}
							{disabled}
							name="ingredientNames"
							type="text"
							placeholder="Tomatoes, Flour, ..."
							bind:value={name}
						/>
					{/snippet}
				</Form.Control>
			</Form.Field> -->
			<span class="w-full">{name}</span>

			<div class="flex">
				<Button
					variant="ghost"
					size="icon"
					class="ml-auto size-8 min-w-8"
					{disabled}
					onclick={() => {
						isOptional = !isOptional;
					}}
				>
					<ArrowUpDown />
					<span class="sr-only">Toggle Optional</span>
				</Button>

				<Button
					variant="ghost"
					size="icon"
					class="size-8 min-w-8"
					disabled={disableDelete || disabled}
					onclick={() => {
						onDelete?.();
					}}
				>
					<X />
					<span class="sr-only">Delete</span>
				</Button>
			</div>
		</div>
	</div>

	<!-- {#if $errors.ingredientAmounts?.[i]}
		<p class="ml-6 text-destructive text-sm font-medium">
			{$errors.ingredientAmounts[i]}
		</p>
	{/if}
	{#if $errors.ingredientUnits?.[i]}
		<p class="ml-6 text-destructive text-sm font-medium">
			{$errors.ingredientUnits[i]}
		</p>
	{/if}
	{#if $errors.ingredientNames?.[i]}
		<p class="ml-6 text-destructive text-sm font-medium">
			{$errors.ingredientNames[i]}
		</p>
	{/if} -->
</div>
