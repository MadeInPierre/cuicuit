<script lang="ts">
	import { Button } from '$lib/shared/components/ui/button';
	import * as DropdownMenu from '$lib/shared/components/ui/dropdown-menu/index.js';
	import Loader2 from 'lucide-svelte/icons/loader-circle';
	import { ChevronsUpDown, HousePlus, Share2, UserPlus } from 'lucide-svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { cn } from '$lib/utils';
	import * as Tabs from '$lib/shared/components/ui/tabs/index.js';
	import * as Dialog from '$lib/shared/components/ui/dialog/index.js';
	import CreateSpaceForm from '$lib/features/spaces/components/CreateSpaceForm.svelte';
	import { spaceIcons, themeButtonClasses, type SpaceIconKey, type SpaceThemeKey } from '../consts';
	import JoinSpaceForm from './JoinSpaceForm.svelte';
	import * as Sidebar from '$lib/shared/components/ui/sidebar/index.js';
	import { userState } from '$lib/features/auth/state/user-state.svelte';

	const activeSpace = getActiveSpaceState();
	const ActiveTeamIcon = $derived(
		spaceIcons[activeSpace.activeSpace?.icon as SpaceIconKey] || Loader2
	);

	let openDialog = $state(false);
	let activeTab: 'create' | 'join' = $state('create');
</script>

{#snippet tabList()}
	<Tabs.List class="grid w-full grid-cols-2 mt-6 mb-4">
		<Tabs.Trigger value="create">
			<HousePlus class="mr-2 size-4" />
			Create new
		</Tabs.Trigger>
		<Tabs.Trigger value="join">
			<UserPlus class="mr-2 size-4" />
			Join a space
		</Tabs.Trigger>
	</Tabs.List>
{/snippet}

<Dialog.Root bind:open={openDialog}>
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			<!-- <Button
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
			</Button> -->
			{#snippet child({ props })}
				<Sidebar.MenuButton
					{...props}
					size="lg"
					class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
				>
					<div
						class={cn(
							'bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg transition-colors',
							activeSpace.activeMember &&
								themeButtonClasses[activeSpace.activeMember.theme as SpaceThemeKey]
						)}
					>
						<ActiveTeamIcon class={cn('size-4', !activeSpace.id && 'animate-spin')}
						></ActiveTeamIcon>
					</div>
					<div class="grid flex-1 text-left text-sm leading-tight">
						<span class="truncate font-semibold">
							{activeSpace.activeSpace?.name || 'Loading...'}
						</span>
						<span class="truncate text-xs">
							{Object.keys(activeSpace.activeSpace?.members || {}).length} member{Object.keys(
								activeSpace.activeSpace?.members || {}
							).length > 1
								? 's'
								: ''}
						</span>
					</div>
					<ChevronsUpDown class="ml-auto" />
				</Sidebar.MenuButton>
			{/snippet}
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

			<!-- Display the spaces alphabetically -->
			{#if activeSpace.userSpaces && activeSpace.userSpaces.length > 0}
				{#each [...activeSpace.userSpaces].sort( (a, b) => a.name.localeCompare(b.name) ) as space (space.id)}
					{@const TeamIcon = spaceIcons[space.icon as SpaceIconKey]}
					{@const userTheme =
						space.members?.find((m) => m.user_id === userState.user?.id)?.theme || 'default'}

					<DropdownMenu.Item onclick={() => (activeSpace.id = space.id)} class="gap-2 p-2 group">
						<div
							class={cn(
								'flex size-6 items-center justify-center rounded-sm',
								themeButtonClasses[userTheme as SpaceThemeKey] || 'bg-background'
							)}
						>
							<TeamIcon class="size-4 shrink-0"></TeamIcon>
						</div>
						{space.name}
						<DropdownMenu.Shortcut class="group-hover:block hidden">
							<Button size="icon" class="size-6" variant="ghost">
								<Share2 class="size-4" />
							</Button>
						</DropdownMenu.Shortcut>
					</DropdownMenu.Item>
				{/each}
			{:else}
				<DropdownMenu.Item disabled class="p-2">No spaces found.</DropdownMenu.Item>
			{/if}

			<DropdownMenu.Separator />

			<Dialog.Trigger class="w-full">
				<DropdownMenu.Item
					class="gap-2 p-2"
					onclick={() => {
						activeTab = 'create';
						openDialog = true;
					}}
				>
					<div class="bg-background flex size-6 items-center justify-center rounded-md border">
						<HousePlus class="size-4" />
					</div>
					<div class="text-muted-foreground font-medium">Create a space...</div>
				</DropdownMenu.Item>
				<DropdownMenu.Item
					class="gap-2 p-2"
					onclick={() => {
						activeTab = 'join';
						openDialog = true;
					}}
				>
					<div class="bg-background flex size-6 items-center justify-center rounded-md border">
						<UserPlus class="size-4" />
					</div>
					<div class="text-muted-foreground font-medium">Join a space...</div>
				</DropdownMenu.Item>
			</Dialog.Trigger>
		</DropdownMenu.Content>
	</DropdownMenu.Root>

	<Dialog.Content class="max-w-[425px]">
		<Tabs.Root bind:value={activeTab}>
			<Tabs.Content value="create" class="">
				<Dialog.Header class="w-min whitespace-nowrap">
					<Dialog.Title class="flex gap-2 items-center">
						<HousePlus class="size-5" />
						Create a new space
					</Dialog.Title>
					<Dialog.Description>
						Share it on the next step with family and friends!
					</Dialog.Description>
				</Dialog.Header>

				{@render tabList()}

				<CreateSpaceForm bind:openDialog />
			</Tabs.Content>

			<Tabs.Content value="join" class="">
				<Dialog.Header class="w-min whitespace-nowrap">
					<Dialog.Title class="flex gap-2 items-center">
						<UserPlus class="size-5" />
						Join someone's space
					</Dialog.Title>
					<Dialog.Description>Enter the invite link to join someone's space.</Dialog.Description>
				</Dialog.Header>

				{@render tabList()}

				<JoinSpaceForm bind:openDialog />
			</Tabs.Content>
		</Tabs.Root>
	</Dialog.Content>
</Dialog.Root>
