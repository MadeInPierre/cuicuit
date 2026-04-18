<script lang="ts">
	import * as Form from '$lib/shared/components/ui/form';
	import * as Select from '$lib/shared/components/ui/select/index.js';
	import IngredientImage from '$lib/features/recipes/components/IngredientImage.svelte';
	import { ArrowUpDown, GripVertical, X } from 'lucide-svelte';
	import { Input } from '$lib/shared/components/ui/input';
	import { Button } from '$lib/shared/components/ui/button';
	import { unitLabels } from '$lib/shared/utils/quantity';

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
		<div class="w-full flex gap-2 items-center">
			<!-- <GripVertical class="size-6 text-muted-foreground cursor-grab" /> -->
			<!-- <IngredientSelectDropdown /> -->

			<IngredientImage {id} {name} class="w-10 h-10" />

			<div class="flex">
				<Form.Field {form} name="ingredientAmounts" class="space-y-0">
					<Form.Control>
						{#snippet children({ props })}
							<Input
								{...props}
								{disabled}
								name="ingredientAmounts"
								type="number"
								step="0.1"
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
								<Select.Trigger class="gap-1 bg-muted/40 rounded-l-none w-20 h-9">
									{unit && Object.keys(unitLabels).includes(unit) ? unit : ''}
								</Select.Trigger>
								<Select.Content>
									{#each Object.entries(unitLabels) as [key, label]}
										<Select.Item value={key} {label} />
									{/each}
								</Select.Content>
							</Select.Root>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<Form.Field {form} name="ingredientNames" class="space-y-0 w-full">
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
			</Form.Field>

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
