<script lang="ts">
	import IngredientImage from '$lib/features/recipes/components/IngredientImage.svelte';
	import UnitPicker from '$lib/features/recipes/components/UnitPicker.svelte';
	import { Badge } from '$lib/shared/components/ui/badge';
	import { Button } from '$lib/shared/components/ui/button';
	import * as Form from '$lib/shared/components/ui/form';
	import { Input } from '$lib/shared/components/ui/input';
	import { useMedia } from '$lib/shared/hooks/use-media.svelte';
	import { formatQuantity } from '$lib/shared/utils/format-quantity';
	import { ArrowUpDown, Pencil, PencilOff, Trash } from '@lucide/svelte';

	type Props = {
		form: any; // TODO: specify form type
		id: string | null; // null for custom ingredients not in the catalog
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

				<UnitPicker
					bind:unit
					{disabled}
					class="w-20 rounded-l-none border-l-0 border-input max-[400px]:w-20"
				/>
			</div>

			<span class="text-ellipsis line-clamp-1 max-[550px]:hidden">
				{name}
			</span>
			{#if !id}
				<Badge variant="secondary" class="shrink-0">Custom</Badge>
			{/if}
		{:else}
			<span class="font-medium line-clamp-1">
				{formatQuantity(amount, unit) || '?'}
			</span>

			<span class="text-ellipsis line-clamp-1">
				{name}
			</span>
			{#if !id}
				<Badge variant="secondary" class="shrink-0">Custom</Badge>
			{/if}
		{/if}

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
