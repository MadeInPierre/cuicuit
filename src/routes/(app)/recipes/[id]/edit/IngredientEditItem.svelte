<script lang="ts">
	import IngredientImage from '$lib/features/recipes/components/IngredientImage.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import * as Form from '$lib/shared/components/ui/form';
	import { Input } from '$lib/shared/components/ui/input';
	import * as Select from '$lib/shared/components/ui/select/index.js';
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';
	import {
		unitLabels,
		unitToRegionized,
		unitToUnregionized,
		type UnitRegionized,
		type UnitUnregionized
	} from '$lib/shared/utils/quantity';
	import { Pencil, Trash } from '@lucide/svelte';
	import { ArrowUpDown, PencilOff } from '@lucide/svelte';
	import { formatQuantityAmount } from '../../../shopping-list/generate-shopping-list';

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

	let edit = $state(false);
	let media = useMedia();
</script>

<div class="grid gap-3">
	<div class="w-full flex gap-3 items-center">
		<IngredientImage {id} {name} class="w-10 h-10 min-w-10" />

		{#if edit || media.sm}
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
								class="w-16 sm:w-20 rounded-r-none border-r-0"
								bind:value={amount}
							/>
						{/snippet}
					</Form.Control>
				</Form.Field>

				<Form.Field {form} name="ingredientUnits" class="space-y-0">
					<Form.Control>
						{#snippet children({ props })}
							<Select.Root type="single" bind:value={unit} {...props} {disabled}>
								<Select.Trigger class="gap-1 bg-muted/40 rounded-l-none max-[400px]:w-20 w-26 h-9">
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

			<span class="text-ellipsis line-clamp-1 max-[550px]:hidden">
				{name}
			</span>
		{:else}
			<span class="font-semi line-clamp-1">
				{amount ? formatQuantityAmount(amount) : ''}

				{unit && Object.keys(unitLabels).includes(unitToUnregionized(unit as UnitRegionized))
					? unitLabels[unitToUnregionized(unit as UnitRegionized)]
					: '?'}
			</span>

			<span class="text-ellipsis line-clamp-1">
				{name}
			</span>
		{/if}

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

		<div class="flex ml-auto">
			{#if edit || media.sm}
				<Button
					variant="ghost"
					size="icon"
					class="ml-auto size-10 min-w-10"
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
					class="size-10 min-w-10"
					disabled={disableDelete || disabled}
					onclick={() => {
						onDelete?.();
					}}
				>
					<Trash />
					<span class="sr-only">Delete</span>
				</Button>
			{:else}
				<Button
					variant="ghost"
					size="icon"
					class="size-10 min-w-10 sm:hidden"
					onclick={() => {
						edit = !edit;
					}}
				>
					{#if edit}
						<PencilOff />
					{:else}
						<Pencil />
					{/if}
					<span class="sr-only">Edit</span>
				</Button>
			{/if}
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
