<script lang="ts">
	import Settings2 from 'lucide-svelte/icons/settings-2';
	import ChefHat from 'lucide-svelte/icons/chef-hat';
	import { Button } from '$lib/shared/components/ui/button/index.js';
	import * as Tooltip from '$lib/shared/components/ui/tooltip/index.js';
	import { LayoutDashboard, Share2, Lightbulb } from 'lucide-svelte';
	import ThemeButton from '$lib/shared/components/ThemeButton.svelte';
	import UserAvatar from '$lib/features/user-settings/components/UserAvatar.svelte';
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import SpaceSwitcher from '../../lib/features/spaces/components/SpaceSwitcher.svelte';
	import { getUserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
	import SyncStatus from './dashboard/SyncStatus.svelte';
	import { getActiveSpaceState } from '$lib/features/spaces/state/active-space.svelte';
	import ShareListDialog from '$lib/features/spaces/components/ShareSpaceDialog.svelte';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	let openShareDialog = $state(false);

	const userDocState = getUserDocState();
	const activeSpace = getActiveSpaceState();
</script>

<div class="grid h-screen w-full pl-[53px]">
	<aside class="inset-y fixed left-0 z-20 flex h-full flex-col border-r">
		<div class="border-b p-2">
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<SpaceSwitcher />
					</Tooltip.Trigger>
					<Tooltip.Content side="right" sideOffset={5}>Change active space</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		</div>

		<nav class="grid gap-1 p-2">
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button
							href="/dashboard"
							variant="ghost"
							size="icon"
							class={cn('rounded-lg', page.url.pathname === '/dashboard' && 'bg-muted')}
							aria-label="Active space"
						>
							<LayoutDashboard class="size-5" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content side="right" sideOffset={5}>Home</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>

			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button
							href="/recipes"
							variant="ghost"
							size="icon"
							class={cn(
								'rounded-lg',
								page.url.pathname.toString().startsWith('/recipes') && 'bg-muted'
							)}
							aria-label="Active space"
						>
							<ChefHat class="size-5" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content side="right" sideOffset={5}>Home</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>

			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button
							href="/settings/space"
							variant="ghost"
							size="icon"
							class={cn('rounded-lg', page.url.pathname === '/settings' && 'bg-muted')}
							aria-label="Settings"
						>
							<Settings2 class="size-5" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content side="right" sideOffset={5}>Settings</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>

			<ShareListDialog bind:open={openShareDialog}>
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button
								variant="ghost"
								size="icon"
								class="rounded-lg"
								aria-label="Share"
								onclick={() => (openShareDialog = true)}
							>
								<Share2 class="size-5" />
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content side="right" sideOffset={5}>Share</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			</ShareListDialog>
		</nav>
		<nav class="mt-auto grid gap-1 p-2">
			<ThemeButton class="flex-col mx-auto" />

			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button variant="ghost" size="icon" class="rounded-lg" aria-label="Help">
							<Lightbulb class="size-5" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content side="right" sideOffset={5}>Feedback</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>

			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button variant="ghost" size="icon" class="rounded-full" aria-label="Account">
							<UserAvatar class="size-9" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content side="right" sideOffset={5}>Account</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		</nav>
	</aside>
	<div class="flex flex-col">
		<header class="bg-background sticky top-0 z-10 flex h-[57px] items-center gap-2 border-b px-4">
			<h1 class="text-xl font-semibold">
				{#if activeSpace.id && activeSpace.userHeader}
					{activeSpace.userHeader.name}
				{:else}
					Loading...
				{/if}
			</h1>

			{#if userDocState.doc}
				<SyncStatus status={userDocState.docState?.syncStatus || 'does-not-exist'} />
			{/if}
		</header>
		<main class="overflow-auto h-full">
			{@render children?.()}
		</main>
	</div>
</div>
