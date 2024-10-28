<script lang="ts">
	import { Button } from '$lib/shared/components/ui/button';
	import * as DropdownMenu from '$lib/shared/components/ui/dropdown-menu/index.js';
	import Loader2 from 'lucide-svelte/icons/loader-circle';
	import { HousePlus, Share2 } from 'lucide-svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { cn } from '$lib/utils';
	import * as Dialog from '$lib/shared/components/ui/dialog/index.js';
	import CreateSpaceForm from '$lib/features/spaces/components/CreateSpaceForm.svelte';
	import { spaceIcons, themeButtonClasses } from '../consts';

	const { ...others } = $props();

	const activeSpace = getActiveSpaceState();
	const ActiveTeamIcon = $derived(
		activeSpace.userHeader ? spaceIcons[activeSpace.userHeader.icon] : Loader2
	);

	let openDialog = $state(false);
</script>

<Dialog.Root bind:open={openDialog}>
	<DropdownMenu.Root>
		<DropdownMenu.Trigger disabled={!activeSpace.id}>
			<Button
				variant={activeSpace.id ? 'ghost' : 'default'}
				disabled={!activeSpace.id}
				size="icon"
				aria-label="Space switcher"
				{...others}
				class={cn(
					'transition-colors',
					activeSpace.userHeader && themeButtonClasses[activeSpace.userHeader.theme]
				)}
			>
				<ActiveTeamIcon class={cn('size-5', !activeSpace.id && 'animate-spin')}></ActiveTeamIcon>
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content
			class="w-[--bits-dropdown-menu-anchor-width] min-w-56 rounded-lg"
			align="start"
			side="right"
			sideOffset={4}
		>
			<DropdownMenu.Label class="text-muted-foreground text-xs">
				{#if activeSpace.id}
					Your spaces
				{:else}
					Loading...
				{/if}
			</DropdownMenu.Label>

			{#each Object.entries(activeSpace.userHeaders) as [spaceId, spaceHeader], index (spaceHeader.name)}
				{@const TeamIcon = spaceIcons[spaceHeader.icon]}

				<DropdownMenu.Item on:click={() => (activeSpace.id = spaceId)} class="gap-2 p-2 group">
					<div class="flex size-6 items-center justify-center rounded-sm border">
						<TeamIcon class="size-4 shrink-0"></TeamIcon>
					</div>
					{spaceHeader.name}
					<DropdownMenu.Shortcut class="group-hover:block hidden">
						<Button size="icon" class="size-6" variant="ghost">
							<Share2 class="size-4" />
						</Button>
					</DropdownMenu.Shortcut>
				</DropdownMenu.Item>
			{/each}
			<DropdownMenu.Separator />
			<Dialog.Trigger asChild>
				<!-- <Button on:click={() => (openDialog = true)} class="mt-8">
					<Plus class="mr-2 size-4" />
					Create a list
				</Button> -->
				<DropdownMenu.Item class="gap-2 p-2" onclick={() => (openDialog = true)}>
					<div class="bg-background flex size-6 items-center justify-center rounded-md border">
						<HousePlus class="size-4" />
					</div>
					<div class="text-muted-foreground font-medium">Add a space...</div>
				</DropdownMenu.Item>
			</Dialog.Trigger>

			<!-- <DropdownMenu.Item class="gap-2 p-2">
				<div class="bg-background flex size-6 items-center justify-center rounded-md border">
					<Users class="size-4" />
				</div>
				<div class="text-muted-foreground font-medium">Join a space...</div>
			</DropdownMenu.Item> -->
		</DropdownMenu.Content>
	</DropdownMenu.Root>

	<Dialog.Content class="max-w-[425px]">
		<Dialog.Header class="w-min whitespace-nowrap">
			<Dialog.Title>Create a new space</Dialog.Title>
			<Dialog.Description>
				Share it on the next step with family and friends!
			</Dialog.Description>
		</Dialog.Header>
		<CreateSpaceForm bind:openDialog />
	</Dialog.Content>
</Dialog.Root>
