<script lang="ts" module>
	export type SelectedIconFunction = (name: string) => void;
</script>

<script lang="ts">
	import * as AlertDialog from '$lib/shared/components/ui/alert-dialog';
	import { Button } from '$lib/shared/components/ui/button';
	import { nature_icons } from '$lib/shared/icons/nature-icons';

	interface Props {
		showWarning: boolean;
		showSelected: boolean;
		selectedIcon: string;
		onChange: SelectedIconFunction;
	}

	let { showWarning, showSelected, selectedIcon = $bindable(), onChange }: Props = $props();
</script>

<div
	class="grid w-full gap-2"
	style="grid-template-columns: repeat(auto-fill, minmax(3rem, 1fr));"
>
	{#each Object.entries(nature_icons) as [icon_name, icon]}
		{@const isSelected = selectedIcon == icon_name}

		{#if showWarning && !isSelected}
			<AlertDialog.Root>
				<AlertDialog.Trigger>
					<Button
						variant="secondary"
						class="flex aspect-square h-full w-full items-center justify-center p-0"
					>
						{@const SvelteComponent = icon}
						<SvelteComponent class="size-5" />
					</Button>
				</AlertDialog.Trigger>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Title>Delete your profile picture?</AlertDialog.Title>
						<AlertDialog.Description>
							Selecting an icon will remove your uploaded photo. This action cannot be undone.
						</AlertDialog.Description>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
						<AlertDialog.Action
							onclick={() => {
								selectedIcon = icon_name;
								onChange(selectedIcon);
							}}
						>
							Delete
						</AlertDialog.Action>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>
		{:else}
			<Button
				variant={isSelected && showSelected ? 'default' : 'secondary'}
				disabled={isSelected && showSelected}
				class="flex aspect-square h-full w-full items-center justify-center p-0"
				onclick={() => {
					selectedIcon = icon_name;
					onChange(selectedIcon);
				}}
			>
				{@const SvelteComponent_1 = icon}
				<SvelteComponent_1 class="size-5" />
			</Button>
		{/if}
	{/each}
</div>
