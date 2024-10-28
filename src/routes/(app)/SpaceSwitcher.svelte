<script lang="ts">
	import { Button } from '$lib/shared/components/ui/button';
	import * as DropdownMenu from '$lib/shared/components/ui/dropdown-menu/index.js';
	import Armchair from 'lucide-svelte/icons/armchair';
	import LampDesk from 'lucide-svelte/icons/lamp-desk';
	import Cat from 'lucide-svelte/icons/cat';
	import Loader2 from 'lucide-svelte/icons/loader-circle';
	import { HousePlus, Share2 } from 'lucide-svelte';
	import { getActiveSpaceState, spaces } from '$lib/features/spaces/state/active-space.svelte';
	import { cn } from '$lib/utils';

	const themeClasses: Record<string, string> = {
		yellow:
			'bg-yellow-500 dark:text-yellow-950 text-white hover:bg-yellow-600 dark:hover:bg-yellow-400',
		blue: 'bg-blue-500 dark:text-blue-950 text-white hover:bg-blue-600 dark:hover:bg-blue-400',
		green: 'bg-green-500 dark:text-green-950 text-white hover:bg-green-600 dark:hover:bg-green-400',
		black: 'bg-secondary text-white hover:bg-secondary-dark dark:hover:bg-secondary-darker'
	} as const;

	const spaceIcons: Record<string, any> = {
		armchair: Armchair,
		'lamp-desk': LampDesk,
		cat: Cat
	} as const;

	const { ...others } = $props();

	const activeSpace = getActiveSpaceState();
	const ActiveTeamIcon = $derived(
		activeSpace.userHeader ? spaceIcons[activeSpace.userHeader.icon] : Loader2
	);
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger disabled={!activeSpace.id}>
		<Button
			variant={activeSpace.id ? 'ghost' : 'default'}
			disabled={!activeSpace.id}
			size="icon"
			aria-label="Space switcher"
			{...others}
			class={activeSpace.userHeader ? themeClasses[activeSpace.userHeader.theme] : ''}
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
				Your homes
			{:else}
				Loading...
			{/if}
		</DropdownMenu.Label>

		{#each Object.entries(spaces) as [spaceId, space], index (space.name)}
			{@const TeamIcon = spaceIcons[space.icon]}

			<DropdownMenu.Item on:click={() => (activeSpace.id = spaceId)} class="gap-2 p-2 group">
				<div class="flex size-6 items-center justify-center rounded-sm border">
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
		<DropdownMenu.Separator />
		<DropdownMenu.Item class="gap-2 p-2">
			<div class="bg-background flex size-6 items-center justify-center rounded-md border">
				<HousePlus class="size-4" />
			</div>
			<div class="text-muted-foreground font-medium">Add a home...</div>
		</DropdownMenu.Item>

		<!-- <DropdownMenu.Item class="gap-2 p-2">
			<div class="bg-background flex size-6 items-center justify-center rounded-md border">
				<Users class="size-4" />
			</div>
			<div class="text-muted-foreground font-medium">Join a home...</div>
		</DropdownMenu.Item> -->
	</DropdownMenu.Content>
</DropdownMenu.Root>
