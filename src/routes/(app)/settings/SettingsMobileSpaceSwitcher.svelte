<script lang="ts">
	import { userState } from '$lib/features/auth/state/user-state.svelte';
	import CreateSpaceForm from '$lib/features/spaces/components/CreateSpaceForm.svelte';
	import JoinSpaceForm from '$lib/features/spaces/components/JoinSpaceForm.svelte';
	import {
		spaceIcons,
		themeButtonClasses,
		type SpaceIconKey,
		type SpaceThemeKey
	} from '$lib/features/spaces/consts';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import * as Dialog from '$lib/shared/components/ui/dialog/index.js';
	import * as Tabs from '$lib/shared/components/ui/tabs/index.js';
	import { cn } from '$lib/utils';
	import { HousePlus, UserPlus } from 'lucide-svelte';
	import Loader2 from 'lucide-svelte/icons/loader-circle';
	import { fade } from 'svelte/transition';
	import SeparatorZigZag from '../shopping-list/SeparatorZigZag.svelte';

	const activeSpace = getActiveSpaceState();
	const ActiveTeamIcon = $derived(
		spaceIcons[activeSpace.activeSpace?.icon as SpaceIconKey] || Loader2
	);

	let openDialog = $state(false);
	let activeTab: 'create' | 'join' = $state('create');
</script>

<div class="max-w-lg rounded-xl bg-white shadow-xs border border-border/60 text-md grid">
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
		{#if activeSpace.userSpaces && activeSpace.userSpaces.length > 0}
			{#each [...activeSpace.userSpaces].sort( (a, b) => a.name.localeCompare(b.name) ) as space (space.id)}
				{@const TeamIcon = spaceIcons[space.icon as SpaceIconKey]}
				{@const userTheme =
					space.members?.find((m) => m.user_id === userState.user?.id)?.theme || 'default'}

				<Button
					onclick={() => (activeSpace.id = space.id)}
					class="justify-start p-8"
					variant="ghost"
				>
					<div
						class={cn(
							'flex size-8 items-center justify-center rounded-sm',
							themeButtonClasses[userTheme as SpaceThemeKey] || 'bg-background'
						)}
					>
						<TeamIcon class="size-5" />
					</div>
					{space.name}

					{#if activeSpace.id === space.id}
						<div transition:fade={{ duration: 75 }} class="text-primary font-bold ml-auto">
							Current
						</div>
					{/if}
				</Button>

				<SeparatorZigZag amplitude={3} pitch={4} opacity={0.1} />
			{/each}
		{:else}
			<Button disabled class="p-2">No spaces found.</Button>
		{/if}

		<Dialog.Trigger class="w-full">
			<Button
				variant="ghost"
				class="justify-start p-8 w-full gap-3"
				onclick={() => {
					activeTab = 'create';
					openDialog = true;
				}}
			>
				<HousePlus class="size-5 ml-7" />
				<div class="text-muted-foreground font-medium">Create or join...</div>
			</Button>
		</Dialog.Trigger>

		<Dialog.Content class="sm:max-w-[410px]">
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
</div>
