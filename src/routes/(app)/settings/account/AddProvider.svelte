<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import * as Command from '$lib/shared/components/ui/command';
	import * as Popover from '$lib/shared/components/ui/popover';
	import { Button } from '$lib/shared/components/ui/button';
	import { cn } from '$lib/utils';
	import { tick } from 'svelte';
	import { Icons } from '$lib/shared/icons';
	import { Link } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	// Props
	type SelectedProviderFunction = (providerId: string) => void;
	export let onSelected: SelectedProviderFunction;
	export let linkedProviderIds: string[] = [];

	const providerList = [
		{
			value: 'google',
			label: 'Google',
			icon: Icons.google
		},
		{
			value: 'github',
			label: 'GitHub',
			icon: Icons.gitHub
		}
	];

	let open = false;
	let value = '';

	function clicked() {
		if (selectedValue) onSelected(selectedValue);
		else toast.warning('Please select a method.');
	}

	$: selectedLabel = providerList.find((f) => f.value === value)?.label;
	$: selectedValue = providerList.find((f) => f.value === value)?.value;

	// Disable reason
	$: disableMaxProviders = linkedProviderIds.length >= 3;
	$: disableAllLinked = linkedProviderIds.length == providerList.length + 1; // +1 for email
	$: disabled = disableMaxProviders || disableAllLinked;

	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger(triggerId: string) {
		open = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}
</script>

<div class="flex items-center space-x-2">
	<Popover.Root bind:open>
		<Popover.Trigger>
			<Button
				variant="outline"
				role="combobox"
				aria-expanded={open}
				class="w-[250px] justify-between"
			>
				{selectedLabel ?? 'Select a method...'}
				<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
			</Button>
		</Popover.Trigger>
		<Popover.Content class="w-[250px] p-0">
			<Command.Root>
				<Command.Input placeholder="Search provider..." />
				<Command.Empty>No provider found.</Command.Empty>
				<Command.Group>
					{#each providerList as provider}
						{@const isLinked = linkedProviderIds.includes(provider.value)}
						<Command.Item
							disabled={isLinked}
							value={provider.value}
							onSelect={() => {
								value = provider.value;
							}}
						>
							<svelte:component this={provider.icon} class="mr-2 h-4 w-4" />
							{provider.label}
							<Check
								class={cn('ml-auto h-4 w-4', value !== provider.value && 'text-transparent')}
							/>

							{#if isLinked}
								<p class="text-xs">Linked</p>
							{/if}
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>

	<Button onclick={clicked} {disabled}>
		<Link class="mr-2 h-4 w-4" />
		Add provider
	</Button>

	<p class="pl-2 text-sm text-muted-foreground">
		{#if disableAllLinked}
			All providers linked.
		{:else if disableMaxProviders}
			Maximum of 3 providers reached.
		{/if}
	</p>
</div>
