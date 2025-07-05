<script lang="ts">
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import { tick } from 'svelte';
	import * as Command from '$lib/shared/components/ui/command/index.js';
	import * as Popover from '$lib/shared/components/ui/popover/index.js';
	import { Button } from '$lib/shared/components/ui/button/index.js';
	import { capitalize, cn } from '$lib/utils.js';

	import ingredients from '$lib/shared/data/marmiton_ingredients_list.json';
	type IngredientsList = { slug: string; name: string; imageUrl: string | null }[];

	const ingredientLabels: { label: string; value: string; image: string | null }[] = ingredients
		.map((ingredient) => ({
			label: capitalize(ingredient.name),
			value: ingredient.slug,
			image: ingredient.imageUrl
		}))
		.filter((f) => f.image !== null);

	let open = $state(false);
	let value = $state('');
	let triggerRef = $state<HTMLButtonElement>(null!);

	const selectedValue = $derived(ingredientLabels.find((f) => f.value === value)?.label);

	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef}>
		{#snippet child({ props })}
			<Button
				variant="outline"
				class="w-[200px] justify-between"
				{...props}
				role="combobox"
				aria-expanded={open}
			>
				{selectedValue || 'Choose...'}
				<ChevronsUpDown class="opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-[400px] p-0" align="start">
		<Command.Root>
			<Command.Input placeholder="Search ingredient..." />
			<Command.List>
				<Command.Empty>No ingredient found.</Command.Empty>
				<Command.Group>
					{#each ingredientLabels.slice(0, 10) as ing}
						<Command.Item
							value={ing.value}
							onSelect={() => {
								value = ing.value;
								closeAndFocusTrigger();
							}}
						>
							<Check class={cn(value !== ing.value && 'text-transparent')} />
							<img src={ing.image} alt={ing.label} class="w-6 h-6 rounded-sm object-cover" />
							<span>{ing.label}</span>
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
